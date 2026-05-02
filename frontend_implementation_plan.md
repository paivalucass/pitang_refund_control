# Frontend Implementation Plan — Pitang Refund Control

## Background

The backend is fully implemented with Express.js, Prisma, JWT auth, Zod validation, and all CRUD/business-logic endpoints for auth, users, categories, and reimbursements (including attachments, history, status transitions). The backend runs on `http://localhost:3000`.

The frontend scaffold is a fresh Vite + React + TypeScript project (`packages/frontend`) with no routing, no UI library, and only the default boilerplate App.tsx.

This plan covers turning it into a fully functional application matching the [specifications](file:///home/lucas/pitang/pitang_refund_control/specifications.md).

---

## User Review Required

> [!IMPORTANT]
> **UI Library**: The spec mandates **ShadcnUI**. This requires installing `tailwindcss`, `@shadcn/ui`, and its CLI. This deviates from the "vanilla CSS" default — confirming because the spec explicitly requires it.

> [!IMPORTANT]
> **Language**: The spec and backend are in **Portuguese (pt-BR)** for user-facing strings (error messages, labels, button text). The frontend will follow the same convention for all user-facing text, while keeping code identifiers in English.

---

## Open Questions

> [!IMPORTANT]
> **Backend Port Proxy**: The backend runs on port `3000`. Should the Vite dev server proxy `/api` → `localhost:3000`, or should the frontend call `http://localhost:3000` directly? **Recommendation**: use a Vite proxy so we avoid CORS issues and simplify deployment.

> [!NOTE]
> **Attachment Upload**: The backend accepts simulated attachments (fileName, fileUrl, fileType). Should the frontend provide a fake "upload" form with these fields, or should we build a file-picker UI that extracts file metadata? **Recommendation**: simple form with name + URL + type dropdown, matching the backend's simulated approach.

---

## Proposed Changes

### Phase 1 — Project Setup & Dependencies

#### [MODIFY] [package.json](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/package.json)

Install required dependencies:

**Runtime**:
- `react-router` — routing (v7+ includes both react-router-dom functionality)
- `dayjs` — date formatting to match backend

**ShadcnUI stack** (as required by the spec):
- `tailwindcss`, `@tailwindcss/vite` — Tailwind CSS v4 (Vite plugin approach)
- `shadcn` CLI — to scaffold components
- `lucide-react` — icon library used by ShadcnUI
- `class-variance-authority`, `clsx`, `tailwind-merge` — ShadcnUI utilities

**Dev/Test**:
- `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `ts-jest`, `jest-environment-jsdom`, `identity-obj-proxy` — testing stack

#### [MODIFY] [vite.config.ts](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/vite.config.ts)

- Add Tailwind CSS v4 Vite plugin
- Add API proxy: `/api` → `http://localhost:3000` (strip `/api` prefix)
- Add path alias `@` → `./src`

#### [MODIFY] [tsconfig.app.json](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/tsconfig.app.json)

- Add `paths` alias: `"@/*": ["./src/*"]`
- Add `baseUrl: "."`

#### [NEW] src/index.css

- Import Tailwind via `@import "tailwindcss"` (v4 syntax)
- Define CSS custom properties for the ShadcnUI theme (colors, radii, fonts)
- Import Google Font (Inter)

#### [NEW] src/lib/utils.ts

- ShadcnUI utility: `cn()` function combining `clsx` + `tailwind-merge`

#### [NEW] jest.config.cjs

- Jest config for React + TypeScript + CSS modules

---

### Phase 2 — Types & API Service Layer

#### [NEW] src/types/index.ts

Shared TypeScript types mirroring backend entities:

```typescript
// Enums
type UserRole = 'EMPLOYEE' | 'MANAGER' | 'FINANCE' | 'ADMIN'
type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELED'
type HistoryAction = 'CREATED' | 'UPDATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELED'
type AttachmentType = 'PDF' | 'JPG' | 'PNG'

// Entities
type User = { id, name, email, role, createdAt, updatedAt }
type Category = { id, name, active, createdAt, updatedAt }
type Reimbursement = { id, requesterId, categoryId, description, amount, expenseDate, status, rejectionReason?, createdAt, updatedAt, requester: User, category: Category, attachments: Attachment[] }
type Attachment = { id, requestId, fileName, fileUrl, fileType, createdAt }
type RequestHistory = { id, requestId, userId, action, note?, createdAt, user: User }

// API error shape
type ApiError = { message, statusCode, error, details?: { field, message }[] }
```

#### [NEW] src/services/api.ts

Central Fetch API wrapper:

- `BASE_URL` = `/api` (proxied by Vite)
- Helper: `apiFetch<T>(url, options?)` — adds `Authorization: Bearer <token>` from localStorage, handles JSON parsing, and throws typed `ApiError` on non-2xx responses
- Automatically redirects to `/login` when receiving 401

#### [NEW] src/services/auth.service.ts

- `login(email, password)` → `POST /api/auth/login`
- `register(name, email, password, role)` → `POST /api/users`

#### [NEW] src/services/categories.service.ts

- `listCategories()` → `GET /api/categories`
- `createCategory(name)` → `POST /api/categories`
- `updateCategory(id, data)` → `PUT /api/categories/:id`

#### [NEW] src/services/reimbursements.service.ts

- `listReimbursements()` → `GET /api/reimbursements`
- `getReimbursement(id)` → `GET /api/reimbursements/:id`
- `createReimbursement(data)` → `POST /api/reimbursements`
- `updateReimbursement(id, data)` → `PUT /api/reimbursements/:id`
- `submitReimbursement(id)` → `POST /api/reimbursements/:id/submit`
- `approveReimbursement(id)` → `POST /api/reimbursements/:id/approve`
- `rejectReimbursement(id, rejectionReason)` → `POST /api/reimbursements/:id/reject`
- `payReimbursement(id)` → `POST /api/reimbursements/:id/pay`
- `cancelReimbursement(id)` → `POST /api/reimbursements/:id/cancel`
- `getHistory(id)` → `GET /api/reimbursements/:id/history`
- `addAttachment(id, data)` → `POST /api/reimbursements/:id/attachments`
- `listAttachments(id)` → `GET /api/reimbursements/:id/attachments`

#### [NEW] src/services/users.service.ts

- `listUsers()` → `GET /api/users`

---

### Phase 3 — Auth Context & Route Protection

#### [NEW] src/contexts/AuthContext.tsx

Context API providing:

```typescript
type AuthContextType = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email, password) => Promise<void>
  register: (name, email, password, role) => Promise<void>
  logout: () => void
}
```

- On mount, reads token/user from `localStorage` and hydrates state
- `login()` calls the API, saves token + user to state and `localStorage`
- `logout()` clears state and `localStorage`, navigates to `/login`
- Exposes `user.role` for RBAC checks throughout the app

#### [NEW] src/components/PrivateRoute.tsx

- Wraps `<Outlet />` and checks `isAuthenticated` from context
- If not authenticated → redirect to `/login`
- Optionally accepts `allowedRoles: UserRole[]` and shows a 403 page if role doesn't match

#### [NEW] src/components/PublicRoute.tsx

- If already authenticated → redirect to `/dashboard`

---

### Phase 4 — Layout & Navigation

#### [NEW] src/components/layout/AppLayout.tsx

Authenticated app shell:
- **Sidebar** (collapsible on mobile) with navigation links filtered by role:
  - EMPLOYEE: Dashboard, Nova Solicitação
  - MANAGER: Dashboard (shows submitted requests)
  - FINANCE: Dashboard (shows approved requests)
  - ADMIN: Dashboard, Categorias, Usuários
- **Header** with user name/role badge, logout button
- **Main content area** renders `<Outlet />`
- Responsive: sidebar collapses into a hamburger menu on small screens

#### [NEW] src/components/ui/\*

ShadcnUI components scaffolded via CLI:
- `Button`, `Input`, `Label`, `Card`, `Dialog`, `Table`, `Badge`, `Select`, `Textarea`, `Separator`, `DropdownMenu`, `Sheet`, `Skeleton`, `Alert`, `Toast/Sonner`, `Form` (optional)

These will be generated using `npx shadcn@latest add <component>` and stored in `src/components/ui/`.

---

### Phase 5 — Pages (Mandatory Screens)

#### [NEW] src/pages/LoginPage.tsx

- Email + password form
- Calls `authContext.login()`
- Shows validation errors inline (required fields)
- Shows API error toast on failure (e.g., "Credenciais inválidas")
- Loading state on submit button
- Link to registration page

#### [NEW] src/pages/RegisterPage.tsx

- Name, email, password, role (dropdown) form
- Calls `authContext.register()`
- Client-side validation: required fields, email format, password min 6 chars
- Shows API errors (e.g., "E-mail já cadastrado")
- On success, navigates to `/login` with success message

#### [NEW] src/pages/DashboardPage.tsx

- Lists reimbursements based on the user's role (the backend already filters by role)
- Table columns: Description, Category, Amount (formatted BRL), Expense Date, Status (badge), Actions
- **Status badges** with color coding:
  - DRAFT → gray
  - SUBMITTED → blue
  - APPROVED → green
  - REJECTED → red
  - PAID → emerald/teal
  - CANCELED → orange
- **Loading skeleton** while fetching
- **Empty state** with illustration and message
- **Error state** with retry button
- **Actions column** (conditional by role + status):
  - EMPLOYEE + DRAFT: Edit, Submit, Cancel
  - EMPLOYEE + SUBMITTED: (view only)
  - MANAGER + SUBMITTED: Approve, Reject
  - FINANCE + APPROVED: Mark as Paid
- Click row → navigates to detail page
- Amounts displayed as `R$ 1.234,56` (pt-BR locale formatting)

#### [NEW] src/pages/NewReimbursementPage.tsx

- Form fields: Category (select from active categories), Description (textarea), Amount (number input), Expense Date (date picker)
- Client-side validation matching backend Zod schemas
- On submit → `createReimbursement()` → navigate to dashboard
- Loading state, error handling with toast

#### [NEW] src/pages/EditReimbursementPage.tsx

- Loads existing reimbursement data via `getReimbursement(id)`
- Pre-fills form fields
- Only accessible if status === DRAFT and user is owner
- Otherwise shows error/redirect
- On save → `updateReimbursement()` → navigate to detail page

#### [NEW] src/pages/ReimbursementDetailPage.tsx

- Shows all reimbursement fields: description, category, amount, expense date, status, requester info, rejection reason (if rejected)
- **Attachments section**: list of attachments with file type icon + name
- **Action buttons** (conditional by role + status):
  - EMPLOYEE + DRAFT: "Editar", "Enviar para Análise", "Cancelar"
  - MANAGER + SUBMITTED: "Aprovar", "Rejeitar" (opens rejection dialog)
  - FINANCE + APPROVED: "Marcar como Pago"
- **Rejection dialog**: modal with mandatory justification textarea
- **History timeline**: chronological list showing action, user, date, note
- Confirmation dialogs for destructive actions

#### [NEW] src/pages/CategoriesPage.tsx (ADMIN only)

- Table: Name, Active (toggle badge), Created At, Actions
- "Nova Categoria" button → opens dialog with name field
- Edit: inline or dialog with name + active toggle
- Deactivated categories shown with visual distinction

#### [NEW] src/pages/UsersPage.tsx (ADMIN only)

- Table: Name, Email, Role (badge), Created At
- Read-only list (backend only supports list for ADMIN)
- Role badges color-coded

#### [NEW] src/pages/NotFoundPage.tsx

- 404 page with link back to dashboard

---

### Phase 6 — Routing Setup

#### [MODIFY] [App.tsx](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/src/App.tsx)

Replace boilerplate with router setup:

```
/login                          → LoginPage (public)
/register                       → RegisterPage (public)

/ (protected, AppLayout)
  /dashboard                    → DashboardPage
  /reimbursements/new           → NewReimbursementPage (EMPLOYEE)
  /reimbursements/:id           → ReimbursementDetailPage
  /reimbursements/:id/edit      → EditReimbursementPage (EMPLOYEE)
  /categories                   → CategoriesPage (ADMIN)
  /users                        → UsersPage (ADMIN)

*                               → NotFoundPage
```

#### [MODIFY] [main.tsx](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/src/main.tsx)

- Wrap `<App />` with `<AuthProvider>` and `<BrowserRouter>`

---

### Phase 7 — Shared Components & Hooks

#### [NEW] src/hooks/useApi.ts

Custom hook for API calls with loading/error state management:

```typescript
function useApi<T>(fetchFn: () => Promise<T>) {
  // Returns { data, loading, error, refetch }
}
```

#### [NEW] src/components/StatusBadge.tsx

- Receives `status: RequestStatus` and renders a color-coded ShadcnUI `<Badge>`

#### [NEW] src/components/RoleBadge.tsx

- Receives `role: UserRole` and renders a color-coded badge

#### [NEW] src/components/ConfirmDialog.tsx

- Reusable confirmation dialog wrapping ShadcnUI `<AlertDialog>`

#### [NEW] src/components/EmptyState.tsx

- Reusable empty state component with icon, title, and optional CTA

#### [NEW] src/components/LoadingTable.tsx

- Skeleton table rows for loading state

#### [NEW] src/components/ErrorState.tsx

- Error display with retry button

---

### Phase 8 — Frontend Tests

#### [NEW] src/\_\_tests\_\_/LoginPage.test.tsx

- Renders login form
- Shows validation errors for empty fields
- Calls login on submit
- Shows API error message

#### [NEW] src/\_\_tests\_\_/DashboardPage.test.tsx

- Renders reimbursement list
- Shows loading state
- Shows empty state
- Conditional action buttons by role

#### [NEW] src/\_\_tests\_\_/NewReimbursementPage.test.tsx

- Form validation (amount > 0, required fields)
- Successful submission

#### [NEW] src/\_\_tests\_\_/AuthContext.test.tsx

- Login sets user and token
- Logout clears state
- Persists across mount/unmount via localStorage

#### [NEW] src/\_\_tests\_\_/StatusBadge.test.tsx

- Renders correct color for each status

---

### Phase 9 — Polish & SEO

#### [MODIFY] [index.html](file:///home/lucas/pitang/pitang_refund_control/packages/frontend/index.html)

- Update `<title>` to "Controle de Reembolsos — Pitang"
- Add meta description
- Add proper lang="pt-BR"

#### General polish

- Toast notifications (via Sonner or ShadcnUI Toast) for all success/error actions
- Smooth page transitions
- Responsive design verified at mobile/tablet/desktop breakpoints
- Date formatting with DayJS in pt-BR locale
- Currency formatting with `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`

---

## File Structure Summary

```
packages/frontend/src/
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx
│   ├── ui/                    # ShadcnUI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── skeleton.tsx
│   │   ├── alert.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── sheet.tsx
│   │   ├── separator.tsx
│   │   ├── label.tsx
│   │   └── sonner.tsx
│   ├── ConfirmDialog.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── LoadingTable.tsx
│   ├── PrivateRoute.tsx
│   ├── PublicRoute.tsx
│   ├── RoleBadge.tsx
│   └── StatusBadge.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useApi.ts
├── lib/
│   └── utils.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── NewReimbursementPage.tsx
│   ├── EditReimbursementPage.tsx
│   ├── ReimbursementDetailPage.tsx
│   ├── CategoriesPage.tsx
│   ├── UsersPage.tsx
│   └── NotFoundPage.tsx
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── categories.service.ts
│   ├── reimbursements.service.ts
│   └── users.service.ts
├── types/
│   └── index.ts
├── __tests__/
│   ├── LoginPage.test.tsx
│   ├── DashboardPage.test.tsx
│   ├── NewReimbursementPage.test.tsx
│   ├── AuthContext.test.tsx
│   └── StatusBadge.test.tsx
├── App.tsx
├── main.tsx
└── index.css
```

---

## Verification Plan

### Automated Tests

```bash
# Frontend unit/component tests
cd packages/frontend && npx jest --runInBand

# Backend tests (already passing — run to confirm nothing breaks)
cd packages/backend && bun test
```

### Browser Testing

1. **Registration flow**: Register a new EMPLOYEE, MANAGER, FINANCE, and ADMIN user
2. **Login flow**: Login with each role, verify correct dashboard content
3. **Full reimbursement lifecycle**:
   - EMPLOYEE creates → edits → submits
   - MANAGER approves (or rejects with justification)
   - FINANCE marks as paid
   - Verify history timeline at each step
4. **RBAC enforcement**: Verify action buttons only appear for allowed roles
5. **Error handling**: Submit invalid data, verify toast errors
6. **Responsive**: Resize browser to mobile width, verify layout
7. **Category management**: ADMIN creates and deactivates categories
