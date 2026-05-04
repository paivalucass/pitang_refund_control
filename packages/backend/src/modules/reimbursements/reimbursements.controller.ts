import type { Request, Response } from "express";
import { AttachmentType } from "../../generated/prisma/index";
import { AppError } from "../../lib/AppError.ts";
import { getPaginationQuery, getValidatedQuery } from "../../lib/pagination.ts";
import type { ListReimbursementsQuery } from "./reimbursements.schemas.ts";
import * as reimbursementsService from "./reimbursements.service.ts";

function getId(req: Request): string {
  return req.params.id as string;
}

export async function list(req: Request, res: Response): Promise<void> {
  const reimbursements = await reimbursementsService.listReimbursements(
    req.user,
    getValidatedQuery<ListReimbursementsQuery>(req)
  );
  res.json(reimbursements);
}

export async function past(req: Request, res: Response): Promise<void> {
  const reimbursements = await reimbursementsService.listPastReimbursements(
    req.user,
    getValidatedQuery<ListReimbursementsQuery>(req)
  );
  res.json(reimbursements);
}

export async function create(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.createReimbursement(
    req.body,
    req.user
  );
  res.status(201).json(reimbursement);
}

export async function detail(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.getReimbursement(
    getId(req),
    req.user
  );
  res.json(reimbursement);
}

export async function update(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.updateReimbursement(
    getId(req),
    req.body,
    req.user
  );
  res.json(reimbursement);
}

export async function submit(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.submitReimbursement(
    getId(req),
    req.user
  );
  res.json(reimbursement);
}

export async function approve(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.approveReimbursement(
    getId(req),
    req.user
  );
  res.json(reimbursement);
}

export async function reject(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.rejectReimbursement(
    getId(req),
    req.body.rejectionReason,
    req.user
  );
  res.json(reimbursement);
}

export async function pay(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.payReimbursement(
    getId(req),
    req.user
  );
  res.json(reimbursement);
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const reimbursement = await reimbursementsService.cancelReimbursement(
    getId(req),
    req.user
  );
  res.json(reimbursement);
}

export async function history(req: Request, res: Response): Promise<void> {
  const entries = await reimbursementsService.getHistory(
    getId(req),
    req.user,
    getPaginationQuery(req)
  );
  res.json(entries);
}

export async function addAttachment(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new AppError("Arquivo é obrigatório", 400);
  }

  const fileTypeByMime = {
    "application/pdf": AttachmentType.PDF,
    "image/jpeg": AttachmentType.JPG,
    "image/png": AttachmentType.PNG,
  } as const;
  const fileType = fileTypeByMime[req.file.mimetype as keyof typeof fileTypeByMime];

  if (!fileType) {
    throw new AppError("Tipo de arquivo inválido. Use PDF, JPG ou PNG.", 400);
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  const attachment = await reimbursementsService.addAttachment(
    getId(req),
    {
      fileName: req.file.originalname,
      fileUrl,
      fileType,
    },
    req.user
  );
  res.status(201).json(attachment);
}

export async function listAttachments(req: Request, res: Response): Promise<void> {
  const attachments = await reimbursementsService.listAttachments(
    getId(req),
    req.user,
    getPaginationQuery(req)
  );
  res.json(attachments);
}
