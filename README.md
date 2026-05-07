![Controle de Reembolsos Pitang](utils/Controle-de-Reembolsos.png)

# Controle de Reembolsos Pitang 🍅

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

- `carlosvictorgomes@pitang.com` (Funcionário)
- `admin@pitang.com` (Administrador)
- `gestor@pitang.com` (Gestor)
- `financeiro@pitang.com` (Financeiro)
- `paula.gestora@pitang.com` (Gestor)
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

---

## Funcionalidades Implementadas

- **Autenticação e sessões:** login, cadastro de usuários, geração de token JWT, refresh token automático e rotas públicas/privadas no frontend.
- **Controle de acesso por perfil:** permissões separadas para `ADMIN`, `EMPLOYEE`, `MANAGER` e `FINANCE`, com navegação e ações adaptadas ao perfil logado.
- **Gestão de usuários:** cadastro público de usuários e listagem administrativa com paginação, busca por nome/e-mail e filtro por perfil.
- **Gestão de categorias:** criação, edição, ativação/desativação, filtro por status, busca por nome, paginação e limite máximo de valor por categoria.
- **Solicitações de reembolso:** criação, edição, visualização detalhada, cancelamento e envio para análise de solicitações em rascunho.
- **Fluxo de aprovação:** gestores podem visualizar solicitações enviadas, aprovar ou rejeitar com justificativa; financeiro pode visualizar solicitações aprovadas e marcar como pagas.
- **Histórico de solicitações:** gestores e financeiro possuem área de histórico com busca, filtros por categoria/status, ordenação e paginação.
- **Dashboard por perfil:** cada perfil visualiza apenas as solicitações e ações relevantes ao seu papel no processo.
- **Estatísticas:** aba dedicada com total geral, quantidade de solicitações, ticket médio, maior categoria, valores por categoria e valores por status, com filtros por categoria e status.
- **Anexos de comprovantes:** upload, listagem, visualização e remoção de anexos em PDF, JPG e PNG com limite de 5MB por arquivo.
- **Armazenamento de anexos:** suporte a armazenamento local em desenvolvimento e Supabase Storage em deploy.
- **Preenchimento automático por anexo:** extração automática de valor, data, descrição provável e categoria provável a partir de comprovantes enviados no formulário.
- **Extração de texto robusta:** leitura de PDFs com texto selecionável, fallback com `pdf-parse`, OCR para imagens e conversão de PDFs sem texto selecionável para imagem antes do OCR.
- **Análise automática de comprovantes:** comparação dos anexos com valor, data, descrição e categoria da solicitação, gerando score de confiabilidade para gestores e financeiro.
- **Inferência por palavras-chave:** identificação de categoria e descrição provável por termos como transporte, alimentação, hospedagem, cursos, equipamentos, Uber, restaurante, posto, combustível e outros.
- **Comparação com descrição do usuário:** a análise tenta encontrar no documento trechos compatíveis com a descrição informada pelo colaborador.
- **Validação de valores extraídos:** a análise usa o valor informado pelo usuário para evitar confundir valores de CPF/CNPJ ou outros números do comprovante com o custo da despesa.
- **Histórico de eventos:** registro de criação, atualização, envio, aprovação, rejeição, pagamento e cancelamento de solicitações.
- **Filtros e paginação:** listagens principais possuem paginação e filtros adequados ao contexto, incluindo busca, categoria, status e ordenação.
- **API documentada no Postman:** collection em `postman/pitang-refund.postman_collection.json` cobrindo as rotas atuais do backend.
- **Testes automatizados:** suíte de testes para backend e frontend cobrindo autenticação, permissões, validações, fluxos de solicitação, componentes e serviços.
- **Ambiente Docker:** execução local com Docker Compose para frontend, backend e PostgreSQL com hot reload.
- **Deploy preparado:** backend com Dockerfile para Render, frontend Vite preparado para Vercel e configuração de armazenamento via Supabase.
