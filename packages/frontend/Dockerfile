FROM oven/bun:alpine AS builder

WORKDIR /app

COPY package.json bun.lock tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

RUN bun install --frozen-lockfile
RUN bun run build

FROM nginx:alpine AS server

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
