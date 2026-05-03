# Add Pagination to Listing Routes

This plan outlines the implementation of pagination across the main listing routes of the application (Users, Categories, Reimbursements, History, and Attachments) to improve performance and user experience when dealing with large datasets. The frontend will be updated to consume the new paginated API and display pagination controls.

## User Review Required
> [!IMPORTANT]
> The backend response structure for the listing routes will change from an array `[]` to an object `{ data: [], meta: { page, limit, total, totalPages } }`. This is a breaking change for the API. The frontend will be updated to match, but any external consumers of these APIs will be affected.

## Proposed Changes

---

### Backend - Common
Add reusable structures to handle pagination.

#### [NEW] packages/backend/src/lib/pagination.ts
- Create a common Zod schema `paginationQuerySchema` to validate `page` and `limit` query parameters with defaults (e.g. `page=1`, `limit=10`).
- Define the `PaginatedResponse<T>` interface.

---

### Backend - Users
#### [MODIFY] packages/backend/src/modules/users/users.router.ts
- Add query validation using `paginationQuerySchema` on the GET `/` route.

#### [MODIFY] packages/backend/src/modules/users/users.controller.ts
- Extract `page` and `limit` from `req.query` and pass them to `usersService.listUsers()`.

#### [MODIFY] packages/backend/src/modules/users/users.service.ts
- Update `listUsers` to accept `page` and `limit`.
- Use `prisma.$transaction` to run `prisma.user.findMany({ skip, take })` and `prisma.user.count()` concurrently.
- Return the `PaginatedResponse` object.

---

### Backend - Categories
#### [MODIFY] packages/backend/src/modules/categories/categories.router.ts
- Add query validation on the GET `/` route.

#### [MODIFY] packages/backend/src/modules/categories/categories.controller.ts
- Pass `page` and `limit` to `categoriesService.listCategories()`.

#### [MODIFY] packages/backend/src/modules/categories/categories.service.ts
- Update `listCategories` to include pagination logic (skip, take, count).

---

### Backend - Reimbursements
#### [MODIFY] packages/backend/src/modules/reimbursements/reimbursements.router.ts
- Add query validation on the `GET /`, `GET /past`, `GET /:id/history`, and `GET /:id/attachments` routes.

#### [MODIFY] packages/backend/src/modules/reimbursements/reimbursements.controller.ts
- Update `list`, `past`, `history`, and `listAttachments` methods to extract `page` and `limit` and pass them to their respective service methods.

#### [MODIFY] packages/backend/src/modules/reimbursements/reimbursements.service.ts
- Modify `listReimbursements`, `listPastReimbursements`, `getHistory`, and `listAttachments` to include `skip` and `take`, perform `count`, and return paginated responses.

---

### Frontend - Types and Components

#### [MODIFY] packages/frontend/src/types/index.ts
- Add a new `PaginatedResponse<T>` interface corresponding to the backend response structure.

#### [NEW] packages/frontend/src/components/PaginationControl.tsx
- Create a reusable pagination UI component using ShadcnUI patterns to display "Previous" / "Next" buttons and page numbers based on `currentPage` and `totalPages`.

---

### Frontend - Services
#### [MODIFY] packages/frontend/src/services/users.service.ts
- Update `listUsers` to accept `page` and `limit` and parse the new `PaginatedResponse` shape.

#### [MODIFY] packages/frontend/src/services/categories.service.ts
- Update `listCategories` for pagination params.

#### [MODIFY] packages/frontend/src/services/reimbursements.service.ts
- Update `listReimbursements`, `listPastReimbursements`, `getHistory`, and `listAttachments` for pagination params.

---

### Frontend - Pages
Each listing page will be updated to manage a `page` state and render the new `PaginationControl` component.

#### [MODIFY] packages/frontend/src/pages/UsersPage.tsx
- Implement pagination state (`page`) and pass it to the service. Render `PaginationControl`.

#### [MODIFY] packages/frontend/src/pages/CategoriesPage.tsx
- Implement pagination state and render `PaginationControl`.

#### [MODIFY] packages/frontend/src/pages/DashboardPage.tsx
- Update active reimbursements list to use pagination.

#### [MODIFY] packages/frontend/src/pages/ReimbursementsHistoryPage.tsx
- Update the historical list to use pagination.

#### [MODIFY] packages/frontend/src/pages/ReimbursementDetailPage.tsx
- Update the history logs and attachments sections (if listed here) to support pagination or a "View More" paginated approach.

## Verification Plan

### Automated Tests
- No new automated tests are specified in the backend, but we will ensure existing API tests (if any) are updated to expect the new paginated structure.

### Manual Verification
- Start the backend and frontend locally.
- Seed the database with more than 10 records for users, categories, and reimbursements to test page overflow.
- Navigate to each of the listing pages on the frontend.
- Verify that changing pages correctly updates the URL (optional but recommended) and fetches new data without error.
- Verify that the total number of pages is displayed correctly.
