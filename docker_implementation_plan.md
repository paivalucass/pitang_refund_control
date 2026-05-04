# Full Dockerization Implementation Plan

This plan details the steps required to fully dockerize the `pitang_refund_control` project so that anyone can clone the repository and run the entire stack (Database, Backend, Frontend) with a single `docker compose up` command. It also includes automatic database migrations and seeding upon startup.

## User Review Required
> [!IMPORTANT]
> - The **Backend** will run on port `3000` internally and run migrations/seeds every time the container starts.
> - The **Frontend** will be built for production and served using **Nginx** on port `80` (mapped to a port of your choice on your host, usually `8080` or `80`). Nginx will also act as a reverse proxy, forwarding requests from `/api` to the backend container.
> - Does this architecture (multi-stage Nginx build for frontend) align with your expectations, or did you want the Docker containers to run in a "hot-reloading" development mode (`bun run dev`)?

## Proposed Changes

---

### 1. Backend Dockerization

#### [NEW] packages/backend/Dockerfile
Create a multi-stage Dockerfile based on `oven/bun:alpine`:
- **Stage 1 (Install & Generate):** Copy `package.json`, `bun.lock`, and `prisma/`. Run `bun install` and `bunx prisma generate` to generate the Prisma client.
- **Stage 2 (Run):** Copy the rest of the source code.
- Define a custom CMD or entrypoint script that sequentially executes:
  1. `bun run db:migrate` (applies database schema)
  2. `bun run db:seed` (populates initial data)
  3. `bun run start` (starts the Express server)
- Expose port `3000`.

---

### 2. Frontend Dockerization

#### [NEW] packages/frontend/nginx.conf
Create a custom Nginx configuration file to handle:
- **React Router:** `try_files $uri $uri/ /index.html;` so SPA routing works correctly.
- **API Proxying:** Intercept requests to `/api/` and `proxy_pass` them to `http://backend:3000/`. (Since `vite.config.ts` strips the `/api` prefix in dev, we will configure Nginx to do the same via `rewrite ^/api/(.*) /$1 break;`).

#### [NEW] packages/frontend/Dockerfile
Create a multi-stage Dockerfile:
- **Stage 1 (Builder):** Use `oven/bun:alpine` to install dependencies and run `bun run build`.
- **Stage 2 (Server):** Use `nginx:alpine`.
  - Copy the built assets from `dist/` to `/usr/share/nginx/html`.
  - Copy the custom `nginx.conf` into `/etc/nginx/conf.d/default.conf`.
- Expose port `80`.

---

### 3. Orchestration

#### [MODIFY] docker-compose.yml
Update the existing Docker Compose file in the root directory to include all three services:

1. **`db` (PostgreSQL)**
   - Keep the existing configuration.
   - Ensure a healthcheck is added so the backend knows when Postgres is ready to accept connections.

2. **`backend`**
   - Build from `./packages/backend`.
   - Expose port `3000` (optional, for direct access if needed).
   - Set environment variables:
     - `DATABASE_URL=postgresql://postgres:postgres@db:5432/pitang_refund?schema=public`
   - Add `depends_on: db` with a `condition: service_healthy` to prevent Prisma from failing before the DB is up.

3. **`frontend`**
   - Build from `./packages/frontend`.
   - Map host port `80` (or `8080`) to container port `80`.
   - Add `depends_on: backend`.

---

## Verification Plan

### Manual Verification
1. Ensure no local instances of Bun or Postgres are running.
2. Run `docker compose up --build` from the root directory.
3. Observe the logs to verify:
   - The database initializes.
   - The backend runs migrations, successfully executes the seed script, and starts the server.
   - The frontend builds and Nginx starts.
4. Navigate to `http://localhost` (or `8080`) in the browser.
5. Verify that the frontend loads, you can log in with a seeded user account, and API requests are successfully proxied to the backend.
