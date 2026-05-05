# Deployment Implementation Plan (Vercel, Render & Supabase)

The goal is to deploy the "Refund Control" project on a fully free-tier infrastructure. 

Since the Render free-tier spins down after inactivity and its disk is ephemeral (temporary), local file uploads using `multer.diskStorage` will be lost when the instance restarts. To resolve this and keep everything free, we will migrate the attachment system to **Supabase Storage**.

## User Review Required

> [!IMPORTANT]
> **Supabase Storage Requirements**
> You must create a new Storage Bucket in your Supabase project named `attachments`. Make sure to set the bucket to **Public** so that the frontend can display the uploaded files via URL without needing signed URLs.

> [!TIP]
> **Render Sleep Prevention**
> Render free instances sleep after 15 minutes of inactivity. To keep the app fast and always running, use a free service like [cron-job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/) to ping your backend's `/health` endpoint every 14 minutes.

## Open Questions

- We will be migrating the `multer` storage strategy from disk to memory (`multer.memoryStorage()`) to upload files directly to Supabase. This means files are temporarily held in RAM. Are you comfortable with this approach for PDF and image files up to 5MB? (This is standard practice and well within free-tier RAM limits).

## Proposed Changes

---

### Backend Components

To solve the ephemeral disk issue, we'll swap out local disk storage for Supabase Storage using `@supabase/supabase-js`. 

#### [MODIFY] `packages/backend/package.json`
- Add `@supabase/supabase-js` to dependencies.

#### [MODIFY] `packages/backend/.env.example`
- Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` variables.

#### [NEW] `packages/backend/src/lib/supabase.ts`
- Create the Supabase client using the environment variables.

#### [MODIFY] `packages/backend/src/middlewares/upload.ts`
- Replace `multer.diskStorage` with `multer.memoryStorage()`.
- Ensure files are streamed into memory limits (already set to 5MB).

#### [MODIFY] `packages/backend/src/modules/reimbursements/reimbursements.service.ts`
- `addAttachment`: Upload the `req.file.buffer` to the Supabase `attachments` bucket and store the returned public URL in the database.
- `removeAttachment`: Delete the file from the Supabase bucket before removing the record from Prisma.
- `analyzeAttachments`: Instead of `fs.readFile` from disk, fetch the public URL and convert the `arrayBuffer` to a Node Buffer for the AI extraction engine.

#### [MODIFY] `packages/backend/src/modules/reimbursements/reimbursements.controller.ts`
- Update the controller to handle `req.file.buffer` (since we are now using memory storage).
- Pass the buffer to the data extraction/analysis logic.

---

### Frontend Components

To deploy the frontend to Vercel, we need to handle dynamic API endpoints and Single Page Application (SPA) routing.

#### [MODIFY] `packages/frontend/src/services/api.ts`
- Change the hardcoded `const BASE_URL = '/api'` to:
  `const BASE_URL = import.meta.env.VITE_API_URL || '/api'`
- This allows Vercel to override the backend URL with the Render backend URL in production.

#### [NEW] `packages/frontend/vercel.json`
- Add a configuration file with URL rewrites to `index.html`. This ensures that React Router works correctly when a user refreshes the page on Vercel.

## Verification Plan

### Automated Tests
- Run existing backend tests (`bun run test`) to ensure no logic was broken. We might need to mock the Supabase client in `reimbursements.service.ts` if there are tests explicitly validating file upload behavior.

### Manual Verification
- Start the application locally using the new `.env` settings.
- Upload a file and verify it appears in the Supabase Dashboard.
- Analyze the uploaded file to ensure `tesseract.js` and `pdf-parse` can still read it from the memory buffer.
- Deploy to Vercel and Render, pointing the environment variables correctly, and ensure full end-to-end functionality.
