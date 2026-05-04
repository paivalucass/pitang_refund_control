FROM oven/bun:alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pitang_refund?schema=public"

RUN bun install --frozen-lockfile
RUN bunx prisma generate

FROM oven/bun:alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY package.json bun.lock prisma.config.ts server.ts app.ts ./
COPY prisma ./prisma
COPY src ./src

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "bunx prisma migrate deploy && bun run db:seed && bun run start"]
