import {
  AttachmentType,
  HistoryAction,
  Prisma,
  RequestStatus,
  UserRole,
  type UserRole as UserRoleType,
} from "../../generated/prisma";

import dayjs from "dayjs";
import { AppError } from "../../lib/AppError.ts";
import { prisma } from "../../lib/prisma.ts";

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
  fileUrl: string;
  fileType: AttachmentType;
};

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

  if (user.role === UserRole.MANAGER && reimbursement.status === RequestStatus.SUBMITTED) {
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

export async function listReimbursements(userInput?: AuthUser) {
  const user = requireUser(userInput);

  const where: Prisma.ReimbursementWhereInput =
    user.role === UserRole.EMPLOYEE
      ? { requesterId: user.id }
      : user.role === UserRole.MANAGER
        ? { status: RequestStatus.SUBMITTED }
        : user.role === UserRole.FINANCE
          ? { status: RequestStatus.APPROVED }
          : {};

  return prisma.reimbursement.findMany({
    where,
    include: reimbursementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createReimbursement(
  data: CreateReimbursementInput,
  userInput?: AuthUser
) {
  const user = requireUser(userInput);
  await ensureActiveCategory(data.categoryId);

  return prisma.$transaction(async (tx) => {
    const reimbursement = await tx.reimbursement.create({
      data: {
        requesterId: user.id,
        categoryId: data.categoryId,
        description: data.description,
        amount: data.amount,
        expenseDate: dayjs(data.expenseDate).toDate(),
        status: RequestStatus.DRAFT,
      },
      include: reimbursementInclude,
    });

    await createHistory(
      tx,
      reimbursement.id,
      user.id,
      HistoryAction.CREATED,
      "Solicitação criada pelo colaborador"
    );

    return reimbursement;
  });
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

  if (data.categoryId) {
    await ensureActiveCategory(data.categoryId);
  }

  if (data.expenseDate) {
    data.expenseDate = dayjs(data.expenseDate).toDate();
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reimbursement.update({
      where: { id },
      data,
      include: reimbursementInclude,
    });

    await createHistory(
      tx,
      id,
      user.id,
      HistoryAction.UPDATED,
      "Solicitação atualizada pelo colaborador"
    );

    return updated;
  });
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

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reimbursement.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason,
      },
      include: reimbursementInclude,
    });

    await createHistory(tx, id, user.id, HistoryAction.REJECTED, rejectionReason);

    return updated;
  });
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
  return prisma.$transaction(async (tx) => {
    const updated = await tx.reimbursement.update({
      where: { id },
      data: { status },
      include: reimbursementInclude,
    });

    await createHistory(tx, id, userId, action, note);

    return updated;
  });
}

export async function getHistory(id: string, userInput?: AuthUser) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureCanView(reimbursement, user);

  return prisma.requestHistory.findMany({
    where: { requestId: id },
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

  return prisma.attachment.create({
    data: {
      requestId: id,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
    },
  });
}

export async function listAttachments(id: string, userInput?: AuthUser) {
  const user = requireUser(userInput);
  const reimbursement = await findReimbursement(id);
  ensureCanView(reimbursement, user);

  return prisma.attachment.findMany({
    where: { requestId: id },
    orderBy: { createdAt: "desc" },
  });
}
