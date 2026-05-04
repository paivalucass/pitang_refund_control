# Expanded Testing Strategy Implementation Plan

This plan outlines the approach to significantly increase test coverage across the `pitang_refund_control` project, including both backend and frontend. It leverages the existing testing structure (Jest + Supertest for backend, Jest + React Testing Library for frontend) to add granular unit tests and broader integration tests.

## User Review Required
> [!IMPORTANT]
> The current test suite focuses primarily on API integration tests (Backend) and a few key Pages/Contexts (Frontend). 
> - **Backend:** Do you want to introduce `jest-mock-extended` or similar to mock Prisma for isolated service unit tests, or continue with the current database-backed integration test approach for all new backend tests? (This plan assumes adding unit tests for middlewares/libs and integration tests for missing edge cases).
> - **Frontend:** We will add tests for missing pages, services, and shared components.

## Proposed Changes

---

### 1. Backend Testing Expansion

Currently, the backend has integration tests for the main routes (`auth.test.ts`, `categories.test.ts`, `reimbursements.test.ts`, `users.test.ts`). We will expand coverage to unit testing core logic and edge cases.

#### [NEW] Unit Tests for Middlewares
- **`packages/backend/src/middlewares/authenticate.test.ts`**: Test valid/invalid JWTs, missing headers, and expired tokens.
- **`packages/backend/src/middlewares/authorize.test.ts`**: Test role-based access control (e.g., block EMPLOYEE from MANAGER routes).
- **`packages/backend/src/middlewares/validate.test.ts`**: Ensure Zod schema errors are correctly mapped to 400 Bad Request responses.
- **`packages/backend/src/middlewares/errorHandler.test.ts`**: Test `AppError` handling, Prisma constraint errors, and generic 500 errors.

#### [NEW] Unit Tests for Utilities
- **`packages/backend/src/lib/pagination.test.ts`**: Test `getPagination`, `getPaginationQuery`, and `paginatedResponse` calculations (skip, take, totalPages).
- **`packages/backend/src/lib/AppError.test.ts`**: Validate custom error instance creation.

#### [MODIFY] Expanded Integration Tests
- **`packages/backend/src/modules/reimbursements/reimbursements.test.ts`**:
  - Add tests for new filtering capabilities (status, category, requesterName).
  - Add tests for sorting (value, date).
  - Add negative test cases (e.g., trying to approve an already approved reimbursement).

---

### 2. Frontend Testing Expansion

The frontend currently tests `AuthContext`, `DashboardPage`, `LoginPage`, `NewReimbursementPage`, and `StatusBadge`. We will add tests for missing pages, services, and shared UI components.

#### [NEW] Component Unit Tests
- **`packages/frontend/src/components/__tests__/RoleBadge.test.tsx`**: Verify rendering of different roles and their respective styles.
- **`packages/frontend/src/components/__tests__/PaginationControl.test.tsx`**: Test next/previous buttons, disabled states on the first/last pages, and page number rendering.
- **`packages/frontend/src/components/__tests__/ConfirmDialog.test.tsx`**: Test rendering, cancel actions, and confirm callback execution.
- **`packages/frontend/src/components/__tests__/ReimbursementFilters.test.tsx`**: Test state changes when selecting filters and triggering the search callback.

#### [NEW] Page Integration/Render Tests
- **`packages/frontend/src/__tests__/CategoriesPage.test.tsx`**: Test loading state, category list rendering, and "Add Category" modal interaction.
- **`packages/frontend/src/__tests__/UsersPage.test.tsx`**: Test user listing and pagination integration.
- **`packages/frontend/src/__tests__/ReimbursementDetailPage.test.tsx`**: 
  - Mock a reimbursement object.
  - Test the display of details, history, and attachments.
  - Test role-based actions (e.g., "Aprovar" button visibility for MANAGER vs. EMPLOYEE).
- **`packages/frontend/src/__tests__/ReimbursementsHistoryPage.test.tsx`**: Test historical list rendering and empty state fallback.

#### [NEW] Service Unit Tests
- **`packages/frontend/src/services/__tests__/api.test.ts`**: Test `apiFetch` interceptor logic (e.g., appending the Authorization header, handling 401 redirects).
- **`packages/frontend/src/services/__tests__/reimbursements.service.test.ts`**: Test query string builder logic for filters and pagination.

---

### 3. Setup and Configuration Improvements

#### [MODIFY] Backend Test Setup
- Improve the teardown logic in `packages/backend/src/test/setup.ts` to ensure database tables are cleanly truncated between tests to prevent cross-test contamination, especially when running concurrent test suites.

#### [MODIFY] Frontend Test Setup
- **`packages/frontend/src/__tests__/setup.ts`**: Add `msw` (Mock Service Worker) setup if not already present, to robustly mock API calls across all page and service tests without needing to stub `fetch` manually.

## Verification Plan

### Execution
- Run `bun test` in `packages/backend` and ensure coverage meets the >80% threshold for critical paths (middlewares, services).
- Run `bun test` in `packages/frontend` and ensure all new component and page tests pass.

### Manual Verification
- Review coverage reports (`--coverage` flag) to verify that edge cases (like unauthorized access, missing inputs) are actively being hit by the new tests.
