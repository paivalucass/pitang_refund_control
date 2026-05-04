# Add Real Attachment Upload and Visualization

This plan details the implementation of real file uploads (PDF, JPG, PNG) for reimbursement attachments, replacing the current simulated URL-based system. The backend will handle file storage locally using `multer` and serve the files statically, while the frontend will provide a file input and visualization capabilities.

## User Review Required
> [!IMPORTANT]
> - We will install `multer` in the backend to handle file uploads.
> - Uploaded files will be stored locally in an `uploads/` directory within the backend package.
> - The backend will serve the `uploads/` directory as static files so the frontend can preview/download them.
> - Do you agree with storing the files locally on the disk for this implementation, or did you have an external storage service (like AWS S3) in mind?

## Proposed Changes

---

### Backend - Dependencies and Configuration

#### [MODIFY] packages/backend/package.json
- Install `multer` as a dependency.
- Install `@types/multer` as a dev dependency.

#### [NEW] packages/backend/src/middlewares/upload.ts
- Create a new `multer` middleware configuration.
- Set the destination to an `uploads/` directory.
- Add a file filter to only allow `application/pdf`, `image/jpeg`, and `image/png`.
- Limit the file size (e.g., 5MB).

#### [MODIFY] packages/backend/app.ts
- Add `app.use('/uploads', express.static('uploads'))` to serve the uploaded files publicly so the frontend can display them.

---

### Backend - Attachments Route and Logic

#### [MODIFY] packages/backend/src/modules/reimbursements/reimbursements.schemas.ts
- Remove `fileName` and `fileUrl` from `attachmentSchema`'s body validation since these will be generated on the backend.
- We can infer the `fileType` from the uploaded file's mimetype, so the schema may be reduced to just validating the params (`id`).

#### [MODIFY] packages/backend/src/modules/reimbursements/reimbursements.router.ts
- Add the `upload.single('file')` middleware to the `POST /:id/attachments` route.

#### [MODIFY] packages/backend/src/modules/reimbursements/reimbursements.controller.ts
- Modify the `addAttachment` controller to extract `req.file`.
- Construct the `fileUrl` based on the server's host and the generated filename (e.g., `http://localhost:3000/uploads/${req.file.filename}`).
- Determine `fileType` (`PDF`, `JPG`, `PNG`) from `req.file.mimetype`.
- Pass these values along with `req.file.originalname` (as `fileName`) to the service.

#### [MODIFY] packages/backend/src/modules/reimbursements/reimbursements.service.ts
- The `addAttachment` service will remain mostly unchanged, but it will receive the calculated `fileName`, `fileUrl`, and `fileType` from the controller instead of directly from user input.

---

### Frontend - API and Services

#### [MODIFY] packages/frontend/src/services/reimbursements.service.ts
- Change the `addAttachment` function signature to accept a `File` object.
- Update the fetch request to use `FormData` instead of `JSON.stringify`.
- Remove the explicit `Content-Type: application/json` header, allowing the browser to automatically set the `multipart/form-data` boundary.

---

### Frontend - Pages and Components

#### [MODIFY] packages/frontend/src/pages/ReimbursementDetailPage.tsx
- Update the attachment dialog form to use an `<input type="file" accept=".pdf,.jpg,.jpeg,.png" />`.
- Remove the manual text inputs for URL, Name, and Type.
- On form submission, pass the selected `File` object to `addAttachment`.
- **Visualization Update**: 
  - Since the backend will serve the files, clicking on the attachment link will open the file in a new tab (handled by the browser for PDFs and images).
  - (Optional) Render a small thumbnail preview for images directly in the attachment list.

## Verification Plan

### Automated Tests
- If there are existing API tests for attachments, they will be updated to send real files using `supertest`'s `.attach()` method instead of sending JSON.

### Manual Verification
- Start both backend and frontend.
- Log in as an employee and navigate to a DRAFT reimbursement.
- Click "Anexo" and upload a local PDF or Image file.
- Verify that the upload is successful and the file appears in the attachment list.
- Click on the uploaded attachment link and confirm that the file opens correctly in the browser.
- Verify that attempting to upload an unsupported file type (e.g., `.txt`) is blocked by the backend and frontend.
