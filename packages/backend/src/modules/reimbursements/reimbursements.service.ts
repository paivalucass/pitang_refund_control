import {
  AttachmentType,
  HistoryAction,
  Prisma,
  RequestStatus,
  UserRole,
  type UserRole as UserRoleType,
} from "../../generated/prisma/index";

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import dayjs from "dayjs";
import { analyzeDocument, type AnalysisResult } from "../analysis/analysis.service.ts";
import { AppError } from "../../lib/AppError.ts";
import { getPagination, paginatedResponse, type PaginationQuery } from "../../lib/pagination.ts";
import { prisma } from "../../lib/prisma.ts";
import { env } from "../../lib/env.ts";
import { getStoragePathFromPublicUrl, getSupabase } from "../../lib/supabase.ts";
import { uploadsDir } from "../../middlewares/upload.ts";
import type { ListReimbursementsQuery } from "./reimbursements.schemas.ts";

type AuthUser = {
  id: string;
  email: string;
  role: UserRoleType;
};

type CreateReimbursementInput = {
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: Date;
};

type UpdateReimbursementInput = Partial<CreateReimbursementInput>;

type AttachmentInput = {
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileType: AttachmentType;
};

type ReimbursementFilterQuery = Pick<
  ListReimbursementsQuery,
  "search" | "categoryId" | "status" | "sortBy" | "sortOrder"
>;

const reimbursementInclude = {
  category: true,
  requester: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  attachments: true,
} satisfies Prisma.ReimbursementInclude;

function requireUser(user?: AuthUser): AuthUser {
  if (!user) {
    throw new AppError("Usuário não autenticado", 401);
  }

  return user;
}

async function ensureActiveCategory(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });

  if (!category || !category.active) {
    throw new AppError("Categoria não encontrada ou inativa", 400);
  }

  return category;
}

async function ensureCategoryAllowsAmount(categoryId: string, amount: number) {
  const category = await ensureActiveCategory(categoryId);

  if (category.valueLimit !== null && amount > Number(category.valueLimit)) {
    throw new AppError(
      `Valor excede o limite da categoria ${category.name}: ${Number(category.valueLimit).toFixed(2)}`,
      400
    );
  }

  return category;
}

async function findReimbursement(id: string) {
  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
    include: reimbursementInclude,
  });

  if (!reimbursement) {
    throw new AppError("Solicitação não encontrada", 404);
  }

  return reimbursement;
}

function ensureOwner(reimbursement: { requesterId: string }, user: AuthUser) {
  if (reimbursement.requesterId !== user.id) {
    throw new AppError("Você não tem permissão para acessar esta solicitação", 403);
  }
}

function ensureCanView(
  reimbursement: { requesterId: string; status: RequestStatus },
  user: AuthUser
) {
  if (user.role === UserRole.ADMIN || reimbursement.requesterId === user.id) {
    return;
  }

  if (
    user.role === UserRole.MANAGER &&
    ([RequestStatus.SUBMITTED, RequestStatus.APPROVED, RequestStatus.PAID] as RequestStatus[]).includes(
      reimbursement.status
    )
  ) {
    return;
  }

  if (
    user.role === UserRole.FINANCE &&
    ([RequestStatus.APPROVED, RequestStatus.PAID] as RequestStatus[]).includes(
      reimbursement.status
    )
  ) {
    return;
  }

  throw new AppError("Você não tem permissão para acessar esta solicitação", 403);
}

function buildReimbursementWhere(
  baseWhere: Prisma.ReimbursementWhereInput,
  { search, categoryId, status }: ReimbursementFilterQuery
): Prisma.ReimbursementWhereInput {
  const filters: Prisma.ReimbursementWhereInput[] = [baseWhere];

  if (categoryId) {
    filters.push({ categoryId });
  }

  if (status) {
    filters.push({ status });
  }

  if (search) {
    filters.push({
      OR: [
        { description: { contains: search, mode: "insensitive" } },
        { requester: { name: { contains: search, mode: "insensitive" } } },
        { requester: { email: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  return { AND: filters };
}

function buildReimbursementOrderBy(
  { sortBy, sortOrder }: ReimbursementFilterQuery,
  fallback: Prisma.ReimbursementOrderByWithRelationInput
): Prisma.ReimbursementOrderByWithRelationInput {
  if (!sortBy) return fallback;
  return { [sortBy]: sortOrder ?? "desc" };
}

export async function listPastReimbursements(
  userInput: AuthUser | undefined,
  { page, limit, ...filters }: ListReimbursementsQuery
) {
  const user = requireUser(userInput);

  if (user.role !== UserRole.MANAGER && user.role !== UserRole.FINANCE) {
    throw new AppError("Você não tem permissão para acessar este histórico", 403);
  }

  const statuses =
    user.role === UserRole.MANAGER
      ? [RequestStatus.APPROVED, RequestStatus.PAID, RequestStatus.REJECTED]
      : [RequestStatus.PAID];

  const baseWhere: Prisma.ReimbursementWhereInput = {
    status: {
      in: statuses,
    },
  };
  const where = buildReimbursementWhere(baseWhere, filters);
  const { skip, take } = getPagination(page, limit);
  const data = await prisma.reimbursement.findMany({
    skip,
    take,
    where,
    include: reimbursementInclude,
    orderBy: buildReimbursementOrderBy(filters, { updatedAt: "desc" }),
  });
  const total = await prisma.reimbursement.count({ where });

  return paginatedResponse(data, { page, limit, total });
}

async function createHistory(
  tx: Prisma.TransactionClient,
  requestId: string,
  userId: string,
  action: HistoryAction,
  note: string
) {
  await tx.requestHistory.create({
    data: {
      requestId,
      userId,
      action,
      note,
    },
  });
}

export async function listReimbursements(
  userInput: AuthUser | undefined,
  { page, limit, ...filters }: ListReimbursementsQuery
) {
  const user = requireUser(userInput);

  const baseWhere: Prisma.ReimbursementWhereInput =
    user.role === UserRole.EMPLOYEE
      ? { requesterId: user.id }
      : user.role === UserRole.MANAGER
        ? { status: RequestStatus.SUBMITTED }
        : user.role === UserRole.FINANCE
          ? { status: RequestStatus.APPROVED }
          : {};

  const where = buildReimbursementWhere(baseWhere, filters);
  const { skip, take } = getPagination(page, limit);
  const data = await prisma.reimbursement.findMany({
    skip,
    take,
    where,
    include: reimbursementInclude,
    orderBy: buildReimbursementOrderBy(filters, { createdAt: "desc" }),
  });
  const total = await prisma.reimbursement.count({ where });

  return paginatedResponse(data, { page, limit, total });
}

export async function createReimbursement(
  data: CreateReimbursementInput,
  userInput?: AuthUser
) {
  const user = requireUser(userInput);
  await ensureCategoryAllowsAmount(data.categoryId, data.amount);

  const reimbursementId = await prisma.$transaction(async (tx) => {
    const reimbursement = await tx.reimbursement.create({
      data: {
        requesterId: user.id,
        categoryId: data.categoryId,
        description: data.description,
        amount: data.amount,
        expenseDate: dayjs(data.expenseDate).toDate(),
        status: RequestStatus.DRAFT,
      },
    });

    await createHistory(
      tx,
      reimbursement.id,
      user.id,
      HistoryAction.CREATED,
      "Solicitação criada pelo colaborador"
    );

    return reimbursement.id;
  });

  return findReimbursement(reimbursementId);
}

export async function getReimbursement(id: string, userInput?: AuthUser) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureCanView(reimbursement, user);
  return reimbursement;
}

export async function updateReimbursement(
  id: string,
  data: UpdateReimbursementInput,
  userInput?: AuthUser
) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureOwner(reimbursement, user);

  if (reimbursement.status !== RequestStatus.DRAFT) {
    throw new AppError("Apenas solicitações em rascunho podem ser editadas", 400);
  }

  if (data.expenseDate) {
    data.expenseDate = dayjs(data.expenseDate).toDate();
  }

  await ensureCategoryAllowsAmount(
    data.categoryId ?? reimbursement.categoryId,
    data.amount ?? Number(reimbursement.amount)
  );

  await prisma.$transaction(async (tx) => {
    await tx.reimbursement.update({
      where: { id },
      data,
    });

    await createHistory(
      tx,
      id,
      user.id,
      HistoryAction.UPDATED,
      "Solicitação atualizada pelo colaborador"
    );
  });

  return findReimbursement(id);
}

export async function submitReimbursement(id: string, userInput?: AuthUser) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureOwner(reimbursement, user);

  if (reimbursement.status !== RequestStatus.DRAFT) {
    throw new AppError("Apenas solicitações em rascunho podem ser enviadas", 400);
  }

  return changeStatus(
    id,
    user.id,
    RequestStatus.SUBMITTED,
    HistoryAction.SUBMITTED,
    "Solicitação enviada para análise"
  );
}

export async function approveReimbursement(id: string, userInput?: AuthUser) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);

  if (reimbursement.status !== RequestStatus.SUBMITTED) {
    throw new AppError("Apenas solicitações enviadas podem ser aprovadas", 400);
  }

  return changeStatus(
    id,
    user.id,
    RequestStatus.APPROVED,
    HistoryAction.APPROVED,
    "Solicitação aprovada pelo gestor"
  );
}

export async function rejectReimbursement(
  id: string,
  rejectionReason: string,
  userInput?: AuthUser
) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);

  if (reimbursement.status !== RequestStatus.SUBMITTED) {
    throw new AppError("Apenas solicitações enviadas podem ser rejeitadas", 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.reimbursement.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason,
      },
    });

    await createHistory(tx, id, user.id, HistoryAction.REJECTED, rejectionReason);
  });

  return findReimbursement(id);
}

export async function payReimbursement(id: string, userInput?: AuthUser) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);

  if (reimbursement.status !== RequestStatus.APPROVED) {
    throw new AppError("Apenas solicitações aprovadas podem ser pagas", 400);
  }

  return changeStatus(
    id,
    user.id,
    RequestStatus.PAID,
    HistoryAction.PAID,
    "Pagamento realizado pelo financeiro"
  );
}

export async function cancelReimbursement(id: string, userInput?: AuthUser) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureOwner(reimbursement, user);

  if (reimbursement.status !== RequestStatus.DRAFT) {
    throw new AppError("Apenas solicitações em rascunho podem ser canceladas", 400);
  }

  return changeStatus(
    id,
    user.id,
    RequestStatus.CANCELED,
    HistoryAction.CANCELED,
    "Solicitação cancelada pelo colaborador"
  );
}

async function changeStatus(
  id: string,
  userId: string,
  status: RequestStatus,
  action: HistoryAction,
  note: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.reimbursement.update({
      where: { id },
      data: { status },
    });

    await createHistory(tx, id, userId, action, note);
  });

  return findReimbursement(id);
}

export async function getHistory(
  id: string,
  userInput: AuthUser | undefined,
  { page, limit }: PaginationQuery
) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureCanView(reimbursement, user);

  const where: Prisma.RequestHistoryWhereInput = { requestId: id };
  const { skip, take } = getPagination(page, limit);
  const data = await prisma.requestHistory.findMany({
    skip,
    take,
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const total = await prisma.requestHistory.count({ where });

  return paginatedResponse(data, { page, limit, total });
}

export async function addAttachment(
  id: string,
  data: AttachmentInput,
  userInput?: AuthUser
) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureOwner(reimbursement, user);

  if (reimbursement.status !== RequestStatus.DRAFT) {
    throw new AppError("Anexos só podem ser adicionados em solicitações em rascunho", 400);
  }

  const fileUrl = await uploadAttachmentFile(data.fileName, data.fileBuffer, data.mimeType);

  return prisma.attachment.create({
    data: {
      requestId: id,
      fileName: data.fileName,
      fileUrl,
      fileType: data.fileType,
    },
  });
}

async function uploadAttachmentFile(fileName: string, fileBuffer: Buffer, mimeType: string) {
  const extension = path.extname(fileName).toLowerCase();
  const storagePath = `${randomUUID()}${extension}`;

  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(env.SUPABASE_ATTACHMENTS_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new AppError(`Não foi possível enviar o anexo: ${error.message}`, 500);
    }

    const { data } = supabase.storage
      .from(env.SUPABASE_ATTACHMENTS_BUCKET)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, storagePath), fileBuffer);
  return `/api/uploads/${storagePath}`;
}

export async function listAttachments(
  id: string,
  userInput: AuthUser | undefined,
  { page, limit }: PaginationQuery
) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureCanView(reimbursement, user);

  const where: Prisma.AttachmentWhereInput = { requestId: id };
  const { skip, take } = getPagination(page, limit);
  const data = await prisma.attachment.findMany({
    skip,
    take,
    where,
    orderBy: { createdAt: "desc" },
  });
  const total = await prisma.attachment.count({ where });

  return paginatedResponse(data, { page, limit, total });
}

export async function removeAttachment(
  id: string,
  attachmentId: string,
  userInput?: AuthUser
) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureOwner(reimbursement, user);

  if (reimbursement.status !== RequestStatus.DRAFT) {
    throw new AppError("Anexos só podem ser removidos em solicitações em rascunho", 400);
  }

  const attachment = await prisma.attachment.findFirst({
    where: {
      id: attachmentId,
      requestId: id,
    },
  });

  if (!attachment) {
    throw new AppError("Anexo não encontrado", 404);
  }

  await removeAttachmentFile(attachment.fileUrl);
  await prisma.attachment.delete({ where: { id: attachmentId } });
}

async function removeAttachmentFile(fileUrl: string) {
  const storagePath = getStoragePathFromPublicUrl(fileUrl);
  if (storagePath && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(env.SUPABASE_ATTACHMENTS_BUCKET)
      .remove([storagePath]);
    if (error) {
      throw new AppError(`Não foi possível remover o anexo: ${error.message}`, 500);
    }
    return;
  }

  await fs.unlink(path.join(uploadsDir, path.basename(fileUrl))).catch(() => undefined);
}

export async function analyzeAttachments(
  id: string,
  userInput?: AuthUser
): Promise<AnalysisResult> {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureCanView(reimbursement, user);

  if (user.role !== UserRole.MANAGER && user.role !== UserRole.FINANCE) {
    throw new AppError("Você não tem permissão para analisar anexos", 403);
  }

  if (reimbursement.attachments.length === 0) {
    throw new AppError("Solicitação não possui anexos para análise", 400);
  }

  const results = await Promise.all(
    reimbursement.attachments.map(async (attachment) => {
      const fileBuffer = await readAttachmentBuffer(attachment.fileUrl);
      return analyzeDocument(fileBuffer, mimeTypeFromAttachment(attachment.fileType), {
        amount: Number(reimbursement.amount),
        expenseDate: reimbursement.expenseDate,
        description: reimbursement.description,
        categoryName: reimbursement.category.name,
      });
    })
  );

  return results.reduce((best, current) => (current.score > best.score ? current : best));
}

async function readAttachmentBuffer(fileUrl: string) {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new AppError("Não foi possível baixar o anexo para análise", 500);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  return fs.readFile(path.join(uploadsDir, path.basename(fileUrl)));
}

function mimeTypeFromAttachment(fileType: AttachmentType) {
  if (fileType === AttachmentType.PDF) return "application/pdf";
  if (fileType === AttachmentType.PNG) return "image/png";
  return "image/jpeg";
}
