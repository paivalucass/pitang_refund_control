import { prisma } from "../lib/prisma.ts";

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "request_history", "attachments", "refund_requests", "categories", "users" RESTART IDENTITY CASCADE'
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
