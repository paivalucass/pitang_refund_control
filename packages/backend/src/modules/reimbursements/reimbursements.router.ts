import { Router } from "express";
import { UserRole } from "../../generated/prisma/index";
import { authenticate } from "../../middlewares/authenticate.ts";
import { authorize } from "../../middlewares/authorize.ts";
import { upload } from "../../middlewares/upload.ts";
import { validate } from "../../middlewares/validate.ts";
import { paginationQuerySchema } from "../../lib/pagination.ts";
import {
  addAttachment,
  analyzeAttachments,
  approve,
  cancel,
  create,
  detail,
  extractData,
  history,
  list,
  listAttachments,
  past,
  pay,
  reject,
  removeAttachment,
  submit,
  update,
} from "./reimbursements.controller.ts";
import {
  attachmentParamsSchema,
  attachmentSchema,
  createReimbursementSchema,
  listReimbursementsQuerySchema,
  reimbursementParamsSchema,
  rejectReimbursementSchema,
  updateReimbursementSchema,
} from "./reimbursements.schemas.ts";
import { z } from "zod";

export const reimbursementsRouter = Router();

reimbursementsRouter.use(authenticate);

reimbursementsRouter.get(
  "/",
  validate(z.object({ query: listReimbursementsQuerySchema })),
  list
);
reimbursementsRouter.get(
  "/history",
  authorize(UserRole.MANAGER, UserRole.FINANCE),
  validate(z.object({ query: listReimbursementsQuerySchema })),
  past
);
reimbursementsRouter.post(
  "/",
  authorize(UserRole.EMPLOYEE),
  validate(createReimbursementSchema),
  create
);
reimbursementsRouter.post(
  "/extract-data",
  authorize(UserRole.EMPLOYEE),
  upload.single("file"),
  extractData
);
reimbursementsRouter.get(
  "/:id",
  validate(reimbursementParamsSchema),
  detail
);
reimbursementsRouter.put(
  "/:id",
  authorize(UserRole.EMPLOYEE),
  validate(updateReimbursementSchema),
  update
);
reimbursementsRouter.post(
  "/:id/submit",
  authorize(UserRole.EMPLOYEE),
  validate(reimbursementParamsSchema),
  submit
);
reimbursementsRouter.post(
  "/:id/approve",
  authorize(UserRole.MANAGER),
  validate(reimbursementParamsSchema),
  approve
);
reimbursementsRouter.post(
  "/:id/reject",
  authorize(UserRole.MANAGER),
  validate(rejectReimbursementSchema),
  reject
);
reimbursementsRouter.post(
  "/:id/pay",
  authorize(UserRole.FINANCE),
  validate(reimbursementParamsSchema),
  pay
);
reimbursementsRouter.post(
  "/:id/cancel",
  authorize(UserRole.EMPLOYEE),
  validate(reimbursementParamsSchema),
  cancel
);
reimbursementsRouter.post(
  "/:id/analyze",
  authorize(UserRole.MANAGER, UserRole.FINANCE),
  validate(reimbursementParamsSchema),
  analyzeAttachments
);
reimbursementsRouter.get(
  "/:id/history",
  validate(z.object({
    params: reimbursementParamsSchema.shape.params,
    query: paginationQuerySchema,
  })),
  history
);
reimbursementsRouter.post(
  "/:id/attachments",
  authorize(UserRole.EMPLOYEE),
  validate(attachmentSchema),
  upload.single("file"),
  addAttachment
);
reimbursementsRouter.get(
  "/:id/attachments",
  validate(z.object({
    params: reimbursementParamsSchema.shape.params,
    query: paginationQuerySchema,
  })),
  listAttachments
);
reimbursementsRouter.delete(
  "/:id/attachments/:attachmentId",
  authorize(UserRole.EMPLOYEE),
  validate(attachmentParamsSchema),
  removeAttachment
);
