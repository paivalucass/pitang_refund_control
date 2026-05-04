# Database Seed Implementation Plan

This plan details the creation of a comprehensive database seed script for the `pitang_refund_control` project. The seed will populate the database with a rich variety of realistic data, ensuring that anyone running the project locally has a fully functional and populated environment to explore all features, including filtering, sorting, and role-based access.

## User Review Required
> [!IMPORTANT]
> The seed script will begin by wiping existing data (`DELETE FROM ...`) to ensure a clean slate every time it's run.
> It will use `bcryptjs` to hash passwords, so all users will have the same default password (e.g., `senha123`) for easy testing.
> Does this sound good, or would you prefer the seed script to *append* data without deleting existing records?

## Proposed Changes

---

### 1. Configuration Setup

#### [MODIFY] packages/backend/package.json
- Add the `prisma` configuration block to tell Prisma how to execute the seed script:
  ```json
  "prisma": {
    "seed": "bun prisma/seed.ts"
  }
  ```

---

### 2. Seed Script Creation

#### [NEW] packages/backend/prisma/seed.ts
Create a script that connects to the database via Prisma and executes the following steps inside a transaction or sequentially:

1. **Database Cleanup**
   - Delete all existing records in reverse dependency order (`Attachment`, `RequestHistory`, `Reimbursement`, `Category`, `User`) to avoid foreign key constraint errors.

2. **Populate Users**
   - Create users covering all roles:
     - 1 `ADMIN` (e.g., admin@pitang.com)
     - 1 `FINANCE` (e.g., financeiro@pitang.com)
     - 1 `MANAGER` (e.g., gestor@pitang.com)
     - 3 `EMPLOYEE`s (e.g., joao@pitang.com, maria@pitang.com, carlos@pitang.com) to provide enough variety for the "Search by Collaborator" filter.
   - All passwords will be hashed as `senha123`.

3. **Populate Categories**
   - Create 4-5 categories:
     - "Alimentação" (Active)
     - "Transporte" (Active)
     - "Hospedagem" (Active)
     - "Cursos e Certificações" (Active, higher value)
     - "Equipamentos" (Inactive - to demonstrate it doesn't appear in new requests)

4. **Populate Reimbursements & History**
   - Programmatically create 15-20 reimbursements distributed among the 3 employees.
   - Assign varying `expenseDate`s and `amount`s to test the sorting functionality.
   - Distribute the statuses to cover the entire lifecycle:
     - 3 `DRAFT` (Can be edited by employees)
     - 4 `SUBMITTED` (Pending manager approval)
     - 3 `APPROVED` (Approved by manager, pending payment)
     - 2 `REJECTED` (Must include a `rejectionReason`)
     - 3 `PAID` (Completed)
     - 2 `CANCELED` (Canceled by employee)
   
5. **Populate Request History**
   - For every reimbursement created, generate the corresponding `RequestHistory` entries to reflect its current status. 
   - Example: A `PAID` request will have history logs for `CREATED` (by employee), `SUBMITTED` (by employee), `APPROVED` (by manager), and `PAID` (by finance), each with appropriate timestamps.

6. **Populate Attachments**
   - Add mock `Attachment` records to a few of the reimbursements (e.g., `receipt.pdf` or `invoice.jpg`) pointing to dummy URLs or a sample file inside `/uploads`.

---

### 3. Verification & Execution

- Once implemented, running `bun run db:seed` in the backend directory will populate the database.
- We will verify by logging into the frontend with different accounts (`admin@pitang.com`, `gestor@pitang.com`, etc.) and ensuring the dashboards reflect the seeded data correctly with pagination and filters working.
