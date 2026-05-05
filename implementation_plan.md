# Goal Description

Implement an AI-powered attachment analysis feature for the Refund Control application. This feature aims to streamline the reimbursement process for both employees and managers by extracting and analyzing data from receipts (PDFs and Images).

The implementation includes two main functionalities:
1. **Autocomplete for Employees**: When creating a new reimbursement, uploading a receipt will automatically extract the text, find the date and amount, and auto-fill the form fields.
2. **Automatic Analysis for Managers**: A button on the reimbursement detail page that automatically analyzes the attachments against the user's submitted fields, generating a "confiability score" (0-100%) to assist in approval decisions.


> **Confiability Score Formula**:
> - 33.3% if the extracted value matches the input amount perfectly.
> - 33.3% if the extracted date matches the input expense date.
> - 33.4% based on the cosine similarity between the extracted text and the user's description using embeddings.

## Proposed Changes

---

### Backend Components

#### [MODIFY] [package.json](file:///home/lucas/pitang/pitang_refund_control/packages/backend/package.json)
- Add dependencies: `tesseract.js` (for image OCR) and `pdf-parse` (for PDF text extraction).

#### [NEW] [scripts/similarity.py](file:///home/lucas/pitang/pitang_refund_control/packages/backend/scripts/similarity.py)
- A Python script utilizing `sentence-transformers` (e.g., `paraphrase-multilingual-MiniLM-L12-v2` for Portuguese support) to generate embeddings.
- Computes the cosine similarity between the extracted document text and the user's input description.
- Outputs the similarity score to `stdout` to be read by the Node.js backend.
- *Note: To avoid loading the model into memory on every request, we can wrap this script in a lightweight Flask/FastAPI server or use a long-running process.*

#### [NEW] [src/modules/analysis/analysis.service.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/src/modules/analysis/analysis.service.ts)
- Create a new service dedicated to document analysis.
- `extractText(fileBuffer, mimeType)`: Uses `tesseract.js` for images (`image/jpeg`, `image/png`) and `pdf-parse` for `application/pdf`.
- `extractEntities(text)`: Uses Regex to find dates (e.g., DD/MM/YYYY) and currency values (e.g., R$ XX.XX or XX,XX).
- `calculateSimilarity(text1, text2)`: Spawns the `similarity.py` Python script via `child_process` or communicates with the Python microservice to get the cosine similarity score.
- `calculateConfiabilityScore(extractedData, userInput)`: Applies the formula to generate the final score.

#### [MODIFY] [src/modules/reimbursements/reimbursements.controller.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/src/modules/reimbursements/reimbursements.controller.ts)
- Add `extractData(req, res)` handler: Receives an uploaded file, extracts text and entities, and returns `{ amount, date, description }` for the frontend autocomplete.
- Add `analyzeAttachments(req, res)` handler: Fetches a reimbursement by ID, downloads its attachments, runs the extraction, compares the results with the reimbursement data in the database, and returns the confiability score and match details.

#### [MODIFY] [src/modules/reimbursements/reimbursements.router.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/src/modules/reimbursements/reimbursements.router.ts)
- `POST /reimbursements/extract-data` (Requires `upload.single("file")` middleware and `EMPLOYEE` role).
- `POST /reimbursements/:id/analyze` (Requires `MANAGER` or `FINANCE` role).

---

### Frontend Components

#### [MODIFY] [src/services/reimbursements.service.ts](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/src/services/reimbursements.service.ts)
- Add `extractDataFromAttachment(file: File): Promise<{ amount?: string, expenseDate?: string, description?: string }>`.
- Add `analyzeReimbursement(id: string): Promise<{ score: number, matches: any }>`.

#### [MODIFY] [src/components/ReimbursementForm.tsx](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/src/components/ReimbursementForm.tsx)
- Add logic to handle file selection. When the user attaches a file, show a loading state (e.g., "Analisando comprovante...") and call `extractDataFromAttachment`.
- Update the form state (`amount`, `expenseDate`, `description`) with the returned data to provide the autocomplete experience.

#### [MODIFY] [src/pages/ReimbursementDetailPage.tsx](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/src/pages/ReimbursementDetailPage.tsx)
- Add an "Analisar Anexos" button (visible only to `MANAGER` and `FINANCE` roles for submitted reimbursements).
- Implement a modal or a new section in the page that displays the results of the analysis:
  - The Confiability Score (e.g., a progress bar or badge colored green/yellow/red based on the score).
  - Detailed breakdown: Did the value match? Did the date match? Similarity of the description.

## Verification Plan

### Automated Tests
- Unit tests for `extractEntities` regex functions to ensure dates and Brazilian Real values are parsed correctly from raw text.
- Unit tests for the `calculateConfiabilityScore` formula.

### Manual Verification
1. **Employee Flow**: Log in as an employee, go to "Nova Solicitação", upload a dummy receipt (image or PDF). Verify that the form fields auto-fill correctly with the data present in the receipt.
2. **Manager Flow**: Submit a reimbursement. Log in as a manager, navigate to the detail page of the reimbursement. Click "Analisar Anexos", and verify that the Confiability Score is calculated correctly and displayed in the UI.
