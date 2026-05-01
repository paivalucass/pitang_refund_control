# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

To run integration tests:

```bash
createdb pitang_refund_test
cp .env.test.example .env.test
DATABASE_URL="$(grep DATABASE_URL_TEST .env.test | cut -d= -f2- | tr -d '"')" bunx prisma migrate deploy
bun run test
```

The test suite requires `DATABASE_URL_TEST` and refuses to run against the development database.

This project was created using `bun init` in bun v1.3.9. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
