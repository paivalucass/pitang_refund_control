import express from "express";
import cors from "cors";
import { errorHandler } from "./src/middlewares/errorHandler.js";

const app = express();

// --------------- Global Middlewares ---------------
app.use(cors());
app.use(express.json());

// --------------- Routes ---------------
// TODO: app.use("/auth",          authRouter);
// TODO: app.use("/users",         usersRouter);
// TODO: app.use("/categories",    categoriesRouter);
// TODO: app.use("/reimbursements", reimbursementsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------- Error Handler (must be last) ---------------
app.use(errorHandler);

export { app };
