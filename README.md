# Pitang Refund Control

Este é o sistema de Controle de Reembolsos da Pitang, desenvolvido com **Backend em Node/Bun** (Express, Prisma, PostgreSQL) e **Frontend em React** (Vite, TailwindCSS, Shadcn UI).

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- [Bun](https://bun.sh/) (para desenvolvimento local e testes)

---

## Executando o Projeto (Modo de Desenvolvimento)

Todo o projeto (Frontend, Backend e Banco de Dados) é orquestrado via Docker Compose, configurado para **hot-reloading**. Isso significa que qualquer alteração que você fizer no código fonte será refletida imediatamente nos containers em execução.

#### 1. **Configuração das Variáveis de Ambiente**
   Antes de iniciar o projeto, adicione as variáveis de ambiente para desenvolvimento e teste local.
   ```bash
   cp packages/backend/.env.example packages/backend/.env && cp packages/backend/.env.test.example packages/backend/.env.test
   ```

#### 2. **Inicie os containers**

   ```bash
   docker compose up --build
   ```

   _Este único comando irá:_
   - Iniciar o banco de dados PostgreSQL.
   - Instalar as dependências do backend, executar as migrations, popular o banco de dados com dados de teste (seed) e iniciar a API com hot-reload em `http://localhost:3000`.
   - Instalar as dependências do frontend e iniciar o servidor de desenvolvimento do Vite em `http://localhost:5173`.

#### 3. **Acesse a Aplicação**
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:3000](http://localhost:3000)

#### 4. **Dados de Login (do Seed)**
   - `admin@pitang.com` (Administrador)
   - `gestor@pitang.com` (Gestor)
   - `paula.gestora@pitang.com` (Gestor)
   - `financeiro@pitang.com` (Financeiro)
   - `ana.financeiro@pitang.com` (Financeiro)
   - `joao@pitang.com` (Funcionário)
   - `maria@pitang.com` (Funcionário)
   - `ana.beatriz@pitang.com` (Funcionário)
   - _Senha para todos os usuários:_ `senha123`

---


## Postman (APIs)

Para testar as requisições da API, você pode importar a Collection do Postman que está localizada na pasta `postman/` na raiz do projeto:

- **Collection:** `postman/pitang-refund.postman_collection.json`

Basta importar esse arquivo no seu aplicativo do Postman para ter acesso a todos os endpoints documentados e configurados.


---

## Executando os Testes

Os testes são executados localmente usando `bun` contra um banco de dados de teste dedicado para garantir que os dados reais nunca sejam apagados.

### Testes do Backend

Os testes do backend dependem de um banco de dados de teste (`pitang_refund_test`).

#### 1. **Navegue até o diretório do backend:**
   ```bash
   cd packages/backend
   ```
#### 2. **Instale as dependências:**
   ```bash
   bun install
   ```
#### 3. **Envie o schema para o banco de dados de teste** 
_(Necessário apenas uma vez ou quando o schema mudar)_
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/pitang_refund_test?schema=public" bunx prisma db push
   ```
#### 4. **Execute os testes:**
   ```bash
   bun run test
   ```
   _(Nota: Se você tiver problemas de compatibilidade do Jest com o Bun, você também pode executar `npx jest --runInBand`)_

### Testes do Frontend

Os testes do frontend são completamente isolados e usam JSDOM, o que significa que você não precisa do banco de dados ou do Docker em execução.

#### 1. **Navegue até o diretório do frontend:**
   ```bash
   cd packages/frontend
   ```
#### 2. **Instale as dependências:**
   ```bash
   bun install
   ```
#### 3. **Execute os testes:**
   ```bash
   bun run test
   ```
