# Backend API Endpoints Implementation

Implement all endpoints from instructions §16 with full business rules from §10, RBAC from §5, validation with Zod, JWT auth, and audit history.

## Proposed Changes

### Shared Middlewares

#### [NEW] [authenticate.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/src/middlewares/authenticate.ts)

JWT verification middleware. Extracts `Authorization: Bearer <token>`, verifies with `jsonwebtoken`, and attaches the decoded user (`id`, `email`, `role`) to `req.user`. Returns `401` if missing/invalid/expired.

#### [NEW] [authorize.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/src/middlewares/authorize.ts)

Role-based access control middleware. Factory function `authorize(...roles: UserRole[])` that checks `req.user.role` against allowed roles. Returns `403` if not allowed.

#### [NEW] [validate.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/src/middlewares/validate.ts)

Zod validation middleware. Factory function `validate(schema)` that validates `req.body`, `req.params`, and `req.query` against a Zod schema before reaching the controller.

#### [MODIFY] [errorHandler.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/src/middlewares/errorHandler.ts)

Fix `err.error` → `err.errors` (Zod v4 API). The user changed this but `err.errors` is the correct property.

---

### Auth Module (`/auth`)

Endpoints:
- `POST /auth/login` — Authenticate user, return JWT

#### [NEW] `src/modules/auth/auth.schemas.ts`
Zod schemas: `loginSchema` (email as valid email, password as non-empty string).

#### [NEW] `src/modules/auth/auth.service.ts`
- `login(email, password)`: Find user by email, compare password with bcryptjs, generate JWT with `jsonwebtoken`, return token + user info (without password).

#### [NEW] `src/modules/auth/auth.controller.ts`
- `login(req, res)`: Validate body → call service → return `{ token, user }`.

#### [NEW] `src/modules/auth/auth.router.ts`
- `POST /login` with validate middleware.

---

### Users Module (`/users`)

Endpoints:
- `POST /users` — Create user (public)
- `GET /users` — List users (ADMIN only)

#### [NEW] `src/modules/users/users.schemas.ts`
Zod schemas: `createUserSchema` (name, email as valid email, password min 6 chars, role as UserRole enum).

#### [NEW] `src/modules/users/users.service.ts`
- `createUser(data)`: Hash password with bcryptjs, create user in DB. Check for duplicate email → `409`.
- `listUsers()`: Return all users (without passwordHash).

#### [NEW] `src/modules/users/users.controller.ts`
- `create(req, res)`: Validate → call service → return `201`.
- `list(req, res)`: Call service → return users array.

#### [NEW] `src/modules/users/users.router.ts`
- `POST /` — public (no auth required for registration)
- `GET /` — authenticate + authorize(ADMIN)

---

### Categories Module (`/categories`)

Endpoints:
- `GET /categories` — List categories (authenticated)
- `POST /categories` — Create category (ADMIN)
- `PUT /categories/:id` — Update category (ADMIN)

#### [NEW] `src/modules/categories/categories.schemas.ts`
Zod schemas: `createCategorySchema` (name required), `updateCategorySchema` (name optional, active optional), `categoryParamsSchema` (id as UUID).

#### [NEW] `src/modules/categories/categories.service.ts`
- `listCategories()`: Return all categories.
- `createCategory(data)`: Create category, check duplicate name → `409`.
- `updateCategory(id, data)`: Find by id → `404` if not found → update.

#### [NEW] `src/modules/categories/categories.controller.ts`

#### [NEW] `src/modules/categories/categories.router.ts`
- `GET /` — authenticate
- `POST /` — authenticate + authorize(ADMIN)
- `PUT /:id` — authenticate + authorize(ADMIN)

---

### Reimbursements Module (`/reimbursements`)

Endpoints:
- `GET /reimbursements` — List by role
- `POST /reimbursements` — Create (EMPLOYEE)
- `GET /reimbursements/:id` — Detail
- `PUT /reimbursements/:id` — Edit (EMPLOYEE owner, DRAFT only)
- `POST /reimbursements/:id/submit` — Submit for review (EMPLOYEE owner)
- `POST /reimbursements/:id/approve` — Approve (MANAGER)
- `POST /reimbursements/:id/reject` — Reject with justification (MANAGER)
- `POST /reimbursements/:id/pay` — Mark as paid (FINANCE)
- `POST /reimbursements/:id/cancel` — Cancel (EMPLOYEE owner)
- `GET /reimbursements/:id/history` — History
- `POST /reimbursements/:id/attachments` — Add attachment (EMPLOYEE owner)
- `GET /reimbursements/:id/attachments` — List attachments

#### [NEW] `src/modules/reimbursements/reimbursements.schemas.ts`
Zod schemas for create (categoryId, description, amount > 0, expenseDate), update, reject (rejectionReason required), params (id UUID), attachment (fileName, fileUrl, fileType enum).

#### [NEW] `src/modules/reimbursements/reimbursements.service.ts`

Business logic per §10:
- **create**: Validate category exists & active, set status DRAFT, create history CREATED.
- **update**: Check owner + DRAFT status, update, create history UPDATED.
- **submit**: Check owner + DRAFT → SUBMITTED, create history SUBMITTED.
- **approve**: Check MANAGER + SUBMITTED → APPROVED, create history APPROVED.
- **reject**: Check MANAGER + SUBMITTED + justification → REJECTED, create history REJECTED.
- **pay**: Check FINANCE + APPROVED → PAID, create history PAID.
- **cancel**: Check owner + DRAFT (or SUBMITTED) → CANCELED, create history CANCELED.
- **list**: Filter by role — EMPLOYEE sees own, MANAGER sees SUBMITTED, FINANCE sees APPROVED, ADMIN sees all.
- **getById**: Return with category, requester, attachments.
- **getHistory**: Return history entries with user info.
- **addAttachment**: Check owner, validate file type, create attachment record.
- **listAttachments**: Return attachments for a reimbursement.

#### [NEW] `src/modules/reimbursements/reimbursements.controller.ts`

#### [NEW] `src/modules/reimbursements/reimbursements.router.ts`

Route → middleware → controller mapping:
| Route | Auth | Authorize | Validate |
|---|---|---|---|
| `GET /` | ✅ | — | — |
| `POST /` | ✅ | EMPLOYEE | body |
| `GET /:id` | ✅ | — | params |
| `PUT /:id` | ✅ | EMPLOYEE | params + body |
| `POST /:id/submit` | ✅ | EMPLOYEE | params |
| `POST /:id/approve` | ✅ | MANAGER | params |
| `POST /:id/reject` | ✅ | MANAGER | params + body |
| `POST /:id/pay` | ✅ | FINANCE | params |
| `POST /:id/cancel` | ✅ | EMPLOYEE | params |
| `GET /:id/history` | ✅ | — | params |
| `POST /:id/attachments` | ✅ | EMPLOYEE | params + body |
| `GET /:id/attachments` | ✅ | — | params |

---

### App Integration

#### [MODIFY] [app.ts](file:///home/lucas/pitang/pitang_refund_control/packages/backend/app.ts)
Import and register all 4 routers, replacing the TODO comments.

---

### Express Types Extension

#### [NEW] `src/types/express.d.ts`
Extend `Express.Request` to include `user` property with `{ id: string; email: string; role: UserRole }`.

## File Structure

```
src/
  types/
    express.d.ts
  lib/
    env.ts
    prisma.ts
    AppError.ts
  middlewares/
    authenticate.ts
    authorize.ts
    validate.ts
    errorHandler.ts
  modules/
    auth/
      auth.schemas.ts
      auth.service.ts
      auth.controller.ts
      auth.router.ts
    users/
      users.schemas.ts
      users.service.ts
      users.controller.ts
      users.router.ts
    categories/
      categories.schemas.ts
      categories.service.ts
      categories.controller.ts
      categories.router.ts
    reimbursements/
      reimbursements.schemas.ts
      reimbursements.service.ts
      reimbursements.controller.ts
      reimbursements.router.ts
```

## Verification Plan

### Automated Tests
- Start the server with `bun run dev`
- Test health check: `curl http://localhost:3000/health`
- Test full flow with curl:
  1. Create user (POST /users)
  2. Login (POST /auth/login)  
  3. Create category as ADMIN
  4. Create reimbursement as EMPLOYEE
  5. Submit → Approve → Pay flow
  6. Verify history entries
