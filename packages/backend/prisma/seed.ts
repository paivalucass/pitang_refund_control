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

type SeedUserKey =
  | "admin"
  | "finance"
  | "financeAna"
  | "manager"
  | "managerPaula"
  | "joao"
  | "maria"
  | "carlos"
  | "ana"
  | "bruno"
  | "patricia";
type EmployeeSeedUserKey = Extract<SeedUserKey, "joao" | "maria" | "carlos" | "ana" | "bruno" | "patricia">;
type SeedCategoryKey =
  | "food"
  | "transport"
  | "hotel"
  | "courses"
  | "equipment"
  | "health"
  | "office"
  | "software"
  | "events";

type ReimbursementSeed = {
  requester: EmployeeSeedUserKey;
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
  financeAna: { name: "Ana Financeiro", email: "ana.financeiro@pitang.com", role: UserRole.FINANCE },
  manager: { name: "Gestor Pitang", email: "gestor@pitang.com", role: UserRole.MANAGER },
  managerPaula: { name: "Paula Menezes", email: "paula.gestora@pitang.com", role: UserRole.MANAGER },
  joao: { name: "João Silva", email: "joao@pitang.com", role: UserRole.EMPLOYEE },
  maria: { name: "Maria Souza", email: "maria@pitang.com", role: UserRole.EMPLOYEE },
  carlos: { name: "Carlos Victor Gomes", email: "carlosvictorgomes@pitang.com", role: UserRole.EMPLOYEE },
  ana: { name: "Ana Beatriz Lima", email: "ana.beatriz@pitang.com", role: UserRole.EMPLOYEE },
  bruno: { name: "Bruno Carvalho", email: "bruno.carvalho@pitang.com", role: UserRole.EMPLOYEE },
  patricia: { name: "Patrícia Nunes", email: "patricia.nunes@pitang.com", role: UserRole.EMPLOYEE },
};

const categories: Record<SeedCategoryKey, { name: string; active: boolean; valueLimit: string | null }> = {
  food: { name: "Alimentação", active: true, valueLimit: "150.00" },
  transport: { name: "Transporte", active: true, valueLimit: "300.00" },
  hotel: { name: "Hospedagem", active: true, valueLimit: "1200.00" },
  courses: { name: "Cursos e Certificações", active: true, valueLimit: "2500.00" },
  equipment: { name: "Equipamentos", active: false, valueLimit: "5000.00" },
  health: { name: "Saúde e Bem-estar", active: true, valueLimit: "600.00" },
  office: { name: "Material de Escritório", active: true, valueLimit: "400.00" },
  software: { name: "Software e Assinaturas", active: true, valueLimit: "900.00" },
  events: { name: "Eventos e Comunidade", active: true, valueLimit: "1800.00" },
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
  {
    requester: "ana",
    category: "software",
    description: "Assinatura mensal do Figma para equipe de UX",
    amount: "78.90",
    expenseDate: "2026-04-21",
    status: RequestStatus.DRAFT,
    attachments: [{ fileName: "figma-invoice.pdf", fileUrl: `${baseUrl}/sample-figma-invoice.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "bruno",
    category: "office",
    description: "Compra de cabos HDMI e adaptadores para sala de reunião",
    amount: "214.35",
    expenseDate: "2026-04-22",
    status: RequestStatus.DRAFT,
  },
  {
    requester: "patricia",
    category: "health",
    description: "Exame ocupacional periódico",
    amount: "180.00",
    expenseDate: "2026-04-23",
    status: RequestStatus.DRAFT,
    attachments: [{ fileName: "recibo-clinica.png", fileUrl: `${baseUrl}/sample-recibo-clinica.png`, fileType: AttachmentType.PNG }],
  },
  {
    requester: "ana",
    category: "food",
    description: "Almoço da equipe no Brazzettus",
    amount: "149.90",
    expenseDate: "2026-04-24",
    status: RequestStatus.SUBMITTED,
    attachments: [{ fileName: "nota-brazzettus.pdf", fileUrl: `${baseUrl}/sample-nota-brazzettus.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "bruno",
    category: "transport",
    description: "Uber para reunião com cliente em Boa Viagem",
    amount: "37.80",
    expenseDate: "2026-04-25",
    status: RequestStatus.SUBMITTED,
    attachments: [{ fileName: "uber-boa-viagem.png", fileUrl: `${baseUrl}/sample-uber-boa-viagem.png`, fileType: AttachmentType.PNG }],
  },
  {
    requester: "patricia",
    category: "events",
    description: "Inscrição no Recife Agile Day",
    amount: "420.00",
    expenseDate: "2026-04-26",
    status: RequestStatus.SUBMITTED,
    attachments: [{ fileName: "ingresso-agile-day.pdf", fileUrl: `${baseUrl}/sample-agile-day.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "joao",
    category: "software",
    description: "Licença anual de ferramenta de logs",
    amount: "860.00",
    expenseDate: "2026-04-27",
    status: RequestStatus.SUBMITTED,
  },
  {
    requester: "maria",
    category: "transport",
    description: "Combustível para visita técnica em Caruaru",
    amount: "238.45",
    expenseDate: "2026-04-28",
    status: RequestStatus.SUBMITTED,
    attachments: [{ fileName: "posto-caruaru.jpg", fileUrl: `${baseUrl}/sample-posto-caruaru.jpg`, fileType: AttachmentType.JPG }],
  },
  {
    requester: "carlos",
    category: "office",
    description: "Material para workshop interno",
    amount: "312.40",
    expenseDate: "2026-04-29",
    status: RequestStatus.APPROVED,
    attachments: [{ fileName: "papelaria-workshop.pdf", fileUrl: `${baseUrl}/sample-papelaria-workshop.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "ana",
    category: "hotel",
    description: "Hotel para agenda comercial em Salvador",
    amount: "1085.00",
    expenseDate: "2026-04-30",
    status: RequestStatus.APPROVED,
    attachments: [{ fileName: "hotel-salvador.pdf", fileUrl: `${baseUrl}/sample-hotel-salvador.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "bruno",
    category: "courses",
    description: "Certificação AWS Cloud Practitioner",
    amount: "690.00",
    expenseDate: "2026-05-01",
    status: RequestStatus.APPROVED,
  },
  {
    requester: "patricia",
    category: "food",
    description: "Jantar com parceiros durante evento",
    amount: "136.70",
    expenseDate: "2026-05-02",
    status: RequestStatus.APPROVED,
    attachments: [{ fileName: "jantar-parceiros.jpg", fileUrl: `${baseUrl}/sample-jantar-parceiros.jpg`, fileType: AttachmentType.JPG }],
  },
  {
    requester: "ana",
    category: "transport",
    description: "Estacionamento sem comprovante fiscal",
    amount: "48.00",
    expenseDate: "2026-05-03",
    status: RequestStatus.REJECTED,
    rejectionReason: "Comprovante anexado não possui identificação do estabelecimento.",
    attachments: [{ fileName: "ticket-estacionamento.png", fileUrl: `${baseUrl}/sample-ticket-estacionamento.png`, fileType: AttachmentType.PNG }],
  },
  {
    requester: "bruno",
    category: "software",
    description: "Assinatura pessoal não autorizada",
    amount: "299.00",
    expenseDate: "2026-05-04",
    status: RequestStatus.REJECTED,
    rejectionReason: "Despesa não está vinculada a uma ferramenta aprovada para o projeto.",
  },
  {
    requester: "patricia",
    category: "events",
    description: "Passagem para evento sem aprovação prévia",
    amount: "980.00",
    expenseDate: "2026-05-05",
    status: RequestStatus.REJECTED,
    rejectionReason: "Viagem para evento precisa de autorização antes da compra.",
  },
  {
    requester: "joao",
    category: "health",
    description: "Vacina para viagem corporativa",
    amount: "220.00",
    expenseDate: "2026-05-06",
    status: RequestStatus.PAID,
    attachments: [{ fileName: "recibo-vacina.pdf", fileUrl: `${baseUrl}/sample-recibo-vacina.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "maria",
    category: "office",
    description: "Cadeiras extras para sala de treinamento",
    amount: "389.90",
    expenseDate: "2026-05-07",
    status: RequestStatus.PAID,
  },
  {
    requester: "carlos",
    category: "software",
    description: "Renovação de domínio para ambiente de testes",
    amount: "112.00",
    expenseDate: "2026-05-08",
    status: RequestStatus.PAID,
    attachments: [{ fileName: "dominio-testes.pdf", fileUrl: `${baseUrl}/sample-dominio-testes.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "ana",
    category: "events",
    description: "Patrocínio de meetup local",
    amount: "1500.00",
    expenseDate: "2026-05-09",
    status: RequestStatus.PAID,
    attachments: [{ fileName: "nota-meetup.pdf", fileUrl: `${baseUrl}/sample-nota-meetup.pdf`, fileType: AttachmentType.PDF }],
  },
  {
    requester: "bruno",
    category: "food",
    description: "Café com candidato cancelado",
    amount: "32.50",
    expenseDate: "2026-05-10",
    status: RequestStatus.CANCELED,
  },
  {
    requester: "patricia",
    category: "hotel",
    description: "Reserva de hotel cancelada pelo cliente",
    amount: "640.00",
    expenseDate: "2026-05-11",
    status: RequestStatus.CANCELED,
    attachments: [{ fileName: "cancelamento-hotel.pdf", fileUrl: `${baseUrl}/sample-cancelamento-hotel.pdf`, fileType: AttachmentType.PDF }],
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

function managerForSeed(seed: ReimbursementSeed, createdUsers: Record<SeedUserKey, { id: string; email: string }>) {
  return seed.requester === "ana" || seed.requester === "bruno" || seed.requester === "patricia"
    ? createdUsers.managerPaula.id
    : createdUsers.manager.id;
}

function financeForSeed(seed: ReimbursementSeed, createdUsers: Record<SeedUserKey, { id: string; email: string }>) {
  return seed.requester === "ana" || seed.requester === "patricia"
    ? createdUsers.financeAna.id
    : createdUsers.finance.id;
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
      data: historyForStatus(seed, requester.id, managerForSeed(seed, createdUsers), financeForSeed(seed, createdUsers)).map((entry) => ({
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
