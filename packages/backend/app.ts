import express from "express";
import cors from "cors";
import { authRouter } from "./src/modules/auth/auth.router.ts";
import { categoriesRouter } from "./src/modules/categories/categories.router.ts";
import { reimbursementsRouter } from "./src/modules/reimbursements/reimbursements.router.ts";
import { usersRouter } from "./src/modules/users/users.router.ts";
import { errorHandler } from "./src/middlewares/errorHandler.ts";

const app = express();

// --------------- Global Middlewares ---------------
app.use(cors());
app.use(express.json());

// --------------- Routes ---------------
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/categories", categoriesRouter);
app.use("/reimbursements", reimbursementsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------- Error Handler (must be last) ---------------
app.use(errorHandler);

export { app };
