import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  AttachmentType,
  HistoryAction,
  PrismaClient,
  RequestStatus,
  UserRole,
  type HistoryAction as HistoryActionType,
  type RequestStatus as RequestStatusType,
} from "../src/generated/prisma/index";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const defaultPassword = "senha123";
const baseUrl = "http://localhost:3000/uploads";

type SeedUserKey = "admin" | "finance" | "manager" | "joao" | "maria" | "carlos";
type SeedCategoryKey = "food" | "transport" | "hotel" | "courses" | "equipment";

type ReimbursementSeed = {
  requester: Extract<SeedUserKey, "joao" | "maria" | "carlos">;
  category: SeedCategoryKey;
  description: string;
  amount: string;
  expenseDate: string;
  status: RequestStatusType;
  rejectionReason?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: AttachmentType;
  }>;
};

const users: Record<SeedUserKey, { name: string; email: string; role: UserRole }> = {
  admin: { name: "Admin Pitang", email: "admin@pitang.com", role: UserRole.ADMIN },
  finance: { name: "Financeiro Pitang", email: "financeiro@pitang.com", role: UserRole.FINANCE },
  manager: { name: "Gestor Pitang", email: "gestor@pitang.com", role: UserRole.MANAGER },
  joao: { name: "João Silva", email: "joao@pitang.com", role: UserRole.EMPLOYEE },
  maria: { name: "Maria Souza", email: "maria@pitang.com", role: UserRole.EMPLOYEE },
  carlos: { name: "Carlos Lima", email: "carlos@pitang.com", role: UserRole.EMPLOYEE },
};

const categories: Record<SeedCategoryKey, { name: string; active: boolean; valueLimit: string | null }> = {
  food: { name: "Alimentação", active: true, valueLimit: "150.00" },
  transport: { name: "Transporte", active: true, valueLimit: "300.00" },
  hotel: { name: "Hospedagem", active: true, valueLimit: "1200.00" },
  courses: { name: "Cursos e Certificações", active: true, valueLimit: "2500.00" },
  equipment: { name: "Equipamentos", active: false, valueLimit: "5000.00" },
};

const reimbursements: ReimbursementSeed[] = [
  {
    requester: "joao",
    category: "food",
    description: "Almoço com cliente no Recife",
    amount: "89.90",
    expenseDate: "2026-04-01",
    status: RequestStatus.DRAFT,
  },
  {
    requester: "maria",
    category: "transport",
    description: "Corridas de aplicativo para visita técnica",
    amount: "142.30",
    expenseDate: "2026-04-03",
    status: RequestStatus.DRAFT,
  },
  {
    requester: "carlos",
    category: "courses",
    description: "Inscrição em workshop de TypeScript",
    amount: "780.00",
    expenseDate: "2026-04-04",
    status: RequestStatus.DRAFT,
  },
  {
    requester: "joao",
    category: "transport",
    description: "Táxi para reunião com fornecedor",
    amount: "64.50",
    expenseDate: "2026-04-05",
    status: RequestStatus.SUBMITTED,
    attachments: [{ fileName: "recibo-taxi.pdf", fileUrl: `${baseUrl}/sample-recibo-taxi.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "maria",
    category: "food",
    description: "Jantar em viagem corporativa",
    amount: "118.40",
    expenseDate: "2026-04-07",
    status: RequestStatus.SUBMITTED,
  },
  {
    requester: "carlos",
    category: "hotel",
    description: "Diária de hotel para implantação",
    amount: "690.00",
    expenseDate: "2026-04-08",
    status: RequestStatus.SUBMITTED,
    attachments: [{ fileName: "nota-hotel.jpg", fileUrl: `${baseUrl}/sample-nota-hotel.jpg`, fileType: AttachmentType.JPG }],
  },
  {
    requester: "joao",
    category: "courses",
    description: "Certificação Scrum",
    amount: "1350.00",
    expenseDate: "2026-04-10",
    status: RequestStatus.SUBMITTED,
  },
  {
    requester: "maria",
    category: "transport",
    description: "Estacionamento em evento comercial",
    amount: "55.00",
    expenseDate: "2026-04-11",
    status: RequestStatus.APPROVED,
  },
  {
    requester: "carlos",
    category: "food",
    description: "Café da manhã em viagem",
    amount: "42.80",
    expenseDate: "2026-04-12",
    status: RequestStatus.APPROVED,
    attachments: [{ fileName: "cupom-cafe.png", fileUrl: `${baseUrl}/sample-cupom-cafe.png`, fileType: AttachmentType.PNG }],
  },
  {
    requester: "joao",
    category: "hotel",
    description: "Hospedagem para treinamento",
    amount: "980.00",
    expenseDate: "2026-04-13",
    status: RequestStatus.APPROVED,
  },
  {
    requester: "maria",
    category: "food",
    description: "Almoço acima do limite combinado",
    amount: "149.90",
    expenseDate: "2026-04-14",
    status: RequestStatus.REJECTED,
    rejectionReason: "Comprovante sem identificação fiscal.",
  },
  {
    requester: "carlos",
    category: "transport",
    description: "Locação de veículo sem aprovação prévia",
    amount: "285.00",
    expenseDate: "2026-04-15",
    status: RequestStatus.REJECTED,
    rejectionReason: "Despesa exige aprovação prévia do gestor.",
  },
  {
    requester: "joao",
    category: "food",
    description: "Almoço durante visita ao cliente",
    amount: "73.20",
    expenseDate: "2026-04-16",
    status: RequestStatus.PAID,
  },
  {
    requester: "maria",
    category: "courses",
    description: "Curso avançado de UX Research",
    amount: "2100.00",
    expenseDate: "2026-04-17",
    status: RequestStatus.PAID,
    attachments: [{ fileName: "invoice-curso.pdf", fileUrl: `${baseUrl}/sample-invoice-curso.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "carlos",
    category: "hotel",
    description: "Hospedagem em visita a cliente",
    amount: "820.00",
    expenseDate: "2026-04-18",
    status: RequestStatus.PAID,
  },
  {
    requester: "joao",
    category: "transport",
    description: "Passagem intermunicipal cancelada",
    amount: "96.00",
    expenseDate: "2026-04-19",
    status: RequestStatus.CANCELED,
  },
  {
    requester: "maria",
    category: "food",
    description: "Despesa lançada em duplicidade",
    amount: "61.70",
    expenseDate: "2026-04-20",
    status: RequestStatus.CANCELED,
  },
];

function atDate(date: string, hour: number) {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00.000Z`);
}

function historyForStatus(seed: ReimbursementSeed, requesterId: string, managerId: string, financeId: string) {
  const entries: Array<{ userId: string; action: HistoryActionType; note?: string; createdAt: Date }> = [
    {
      userId: requesterId,
      action: HistoryAction.CREATED,
      note: "Solicitação criada pelo colaborador.",
      createdAt: atDate(seed.expenseDate, 9),
    },
  ];

  if (
    seed.status === RequestStatus.SUBMITTED ||
    seed.status === RequestStatus.APPROVED ||
    seed.status === RequestStatus.REJECTED ||
    seed.status === RequestStatus.PAID
  ) {
    entries.push({
      userId: requesterId,
      action: HistoryAction.SUBMITTED,
      note: "Solicitação enviada para aprovação.",
      createdAt: atDate(seed.expenseDate, 10),
    });
  }

  if (seed.status === RequestStatus.APPROVED || seed.status === RequestStatus.PAID) {
    entries.push({
      userId: managerId,
      action: HistoryAction.APPROVED,
      note: "Solicitação aprovada pelo gestor.",
      createdAt: atDate(seed.expenseDate, 13),
    });
  }

  if (seed.status === RequestStatus.REJECTED) {
    entries.push({
      userId: managerId,
      action: HistoryAction.REJECTED,
      note: seed.rejectionReason,
      createdAt: atDate(seed.expenseDate, 13),
    });
  }

  if (seed.status === RequestStatus.PAID) {
    entries.push({
      userId: financeId,
      action: HistoryAction.PAID,
      note: "Pagamento registrado pelo financeiro.",
      createdAt: atDate(seed.expenseDate, 16),
    });
  }

  if (seed.status === RequestStatus.CANCELED) {
    entries.push({
      userId: requesterId,
      action: HistoryAction.CANCELED,
      note: "Solicitação cancelada pelo colaborador.",
      createdAt: atDate(seed.expenseDate, 11),
    });
  }

  return entries;
}

async function main() {
  console.log("Cleaning database...");
  await prisma.$transaction([
    prisma.attachment.deleteMany(),
    prisma.requestHistory.deleteMany(),
    prisma.reimbursement.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("Creating users...");
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const createdUsers = {} as Record<SeedUserKey, { id: string; email: string }>;
  for (const key of Object.keys(users) as SeedUserKey[]) {
    const user = users[key];
    createdUsers[key] = await prisma.user.create({
      data: {
        ...user,
        passwordHash,
      },
    });
  }

  console.log("Creating categories...");
  const createdCategories = {} as Record<SeedCategoryKey, { id: string }>;
  for (const key of Object.keys(categories) as SeedCategoryKey[]) {
    createdCategories[key] = await prisma.category.create({ data: categories[key] });
  }

  console.log("Creating reimbursements, history, and attachments...");
  for (const seed of reimbursements) {
    const requester = createdUsers[seed.requester];
    const category = createdCategories[seed.category];
    const createdAt = atDate(seed.expenseDate, 9);

    const reimbursement = await prisma.reimbursement.create({
      data: {
        requesterId: requester.id,
        categoryId: category.id,
        description: seed.description,
        amount: seed.amount,
        expenseDate: atDate(seed.expenseDate, 12),
        status: seed.status,
        rejectionReason: seed.rejectionReason,
        createdAt,
        updatedAt: atDate(seed.expenseDate, 17),
      },
    });

    await prisma.requestHistory.createMany({
      data: historyForStatus(seed, requester.id, createdUsers.manager.id, createdUsers.finance.id).map((entry) => ({
        requestId: reimbursement.id,
        ...entry,
      })),
    });

    if (seed.attachments?.length) {
      await prisma.attachment.createMany({
        data: seed.attachments.map((attachment) => ({
          requestId: reimbursement.id,
          ...attachment,
          createdAt: atDate(seed.expenseDate, 12),
        })),
      });
    }
  }

  console.log("Seed completed.");
  console.log(`Default password for all users: ${defaultPassword}`);
  console.log("Accounts:");
  Object.values(users).forEach((user) => console.log(`- ${user.email} (${user.role})`));
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
