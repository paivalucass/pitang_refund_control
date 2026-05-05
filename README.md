# Pitang Refund Control

This is the Pitang Refund Control system, designed with a robust **Node/Bun Backend** (Express, Prisma, PostgreSQL) and a modern **React Frontend** (Vite, TailwindCSS, Shadcn UI).

## Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose
- [Bun](https://bun.sh/) (for local development and testing)

---

## 🚀 Running the Project (Dev Mode)

The entire project (Frontend, Backend, and Database) is orchestrated via Docker Compose, configured for **hot-reloading**. This means any changes you make to the source code will immediately reflect in the running containers.

1. **Start the containers**
   ```bash
   docker compose up --build
   ```
   *This single command will:*
   - Start the PostgreSQL database.
   - Install backend dependencies, run migrations, seed the database with mock data, and start the API with hot-reload at `http://localhost:3000`.
   - Install frontend dependencies and start the Vite dev server at `http://localhost:5173`.

2. **Access the Application**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:3000](http://localhost:3000)

3. **Login Details (from Seed)**
   - `admin@pitang.com` (Admin)
   - `gestor@pitang.com` (Manager)
   - `financeiro@pitang.com` (Finance)
   - `joao@pitang.com` (Employee)
   - *Password for all users:* `senha123`

---

## 🧪 Running Tests

Tests are executed locally using `bun` against a dedicated test database to ensure your real data is never wiped.

### 1. Backend Tests

The backend tests rely on a test database (`pitang_refund_test`).

1. **Navigate to the backend directory:**
   ```bash
   cd packages/backend
   ```
2. **Push the schema to the test database** *(Only needed once or when schema changes)*:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/pitang_refund_test?schema=public" bunx prisma db push
   ```
3. **Run the tests:**
   ```bash
   bun run test
   ```
   *(Note: If you experience Jest compatibility issues with Bun, you can also run `npx jest --runInBand`)*

### 2. Frontend Tests

Frontend tests are completely isolated and use JSDOM, meaning you don't need the database or Docker running.

1. **Navigate to the frontend directory:**
   ```bash
   cd packages/frontend
   ```
2. **Run the tests:**
   ```bash
   bun run test
   ```
