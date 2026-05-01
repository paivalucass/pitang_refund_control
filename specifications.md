# Instruções para IA da IDE - Controle de Solicitações de Reembolso

Use este documento como especificação funcional e técnica para implementar uma aplicação **fullstack** de controle de solicitações de reembolso.

A aplicação deve permitir que:

- Colaboradores criem, editem, enviem e acompanhem solicitações de reembolso.
- Gestores aprovem ou rejeitem solicitações enviadas.
- Usuários do financeiro marquem solicitações aprovadas como pagas.
- Administradores gerenciem usuários e categorias.

O sistema deve ser simples, funcional, bem organizado e aderente às tecnologias obrigatórias descritas abaixo.

---

## 1. Objetivo do desafio

Construir uma aplicação fullstack para controle de solicitações de reembolso.

O foco principal é avaliar:

- JavaScript e TypeScript.
- Node.js.
- Express.
- APIs RESTful.
- Status HTTP corretos.
- Middlewares.
- JWT.
- Zod.
- ORM.
- Manipulação de datas.
- Testes.
- React.
- Hooks.
- React Router.
- Context API.
- Bibliotecas de UI.

As regras devem ser implementadas de forma clara, objetiva e sem ambiguidades.

Sempre que uma ação for bloqueada:

- A API deve retornar o status HTTP adequado.
- O frontend deve exibir uma mensagem visual compreensível para o usuário.

---

## 2. Stack obrigatória

### Linguagem

Usar **JavaScript e TypeScript**.

Avaliar:

- Tipos.
- Objetos.
- Arrays.
- Funções.
- Estruturas de controle.
- Tratamento de exceções.
- Organização do código.

### Backend

Usar **Node.js + Express.js**.

Avaliar:

- API RESTful.
- Rotas.
- Controllers.
- Middlewares.
- Métodos HTTP.
- Status codes adequados.

### Validação

Usar **Zod** para validar:

- Body.
- Params.
- Query params.

A validação deve acontecer antes da execução das regras de negócio.

### Autenticação

Usar **JWT**.

Implementar:

- Login.
- Geração de token.
- Middleware de autenticação.
- Proteção de rotas privadas.

### Banco de dados

Usar **Prisma**.

Implementar:

- Modelagem das entidades.
- Relacionamentos.
- Migrations ou estrutura inicial.
- Consultas básicas.

### Datas

Usar **DayJS**.

Manipular e exibir corretamente:

- Data da despesa.
- Data de criação.
- Data de atualização.
- Datas do histórico.

### Testes backend

Usar **Jest + Supertest**.

Testar:

- Rotas principais.
- Autenticação.
- Validações.
- Regras de negócio.

### Frontend

Usar **React com Functional Components**.

Avaliar:

- Componentização.
- Props.
- `useState`.
- `useEffect`.
- Hooks seguros.
- Separação de responsabilidades.

### Navegação

Usar **React Router**.

Implementar:

- Rotas públicas.
- Rotas privadas.
- Login.
- Listagem.
- Cadastro.
- Edição.
- Detalhe.

### Estado global

Usar **Context API**.

Controlar:

- Usuário autenticado.
- Token.
- Perfil.
- Permissões no frontend.

### UI e estilos

Usar ShadcnUI.

Avaliar:

- Componentes visuais consistentes.
- Formulários claros.
- Feedbacks de sucesso e erro.
- Layout responsivo.
- Design system básico.

### Testes frontend

Usar **Jest + React Testing Library**.

Testar:

- Componentes.
- Formulários.
- Renderização condicional por perfil.
- Mensagens de erro.

### Consumo de API

Usar **Fetch API**.

Implementar:

- Integração com backend.
- Loading.
- Sucesso.
- Erro.
- Autenticação.

### Teste manual de API

Opcionalmente entregar **collection do Postman** ou documentação simples das rotas.

---

## 3. Itens fora do escopo obrigatório

Os itens abaixo **não devem ser obrigatórios**. Podem ser diferenciais se o fluxo principal estiver funcionando.

| Item                            | Orientação                                                                | Motivo                                                                      |
| ------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Upload real em storage externo  | Não obrigatório. Pode salvar apenas nome, tipo e URL simulada do arquivo. | Storage externo não foi foco da ementa.                                     |
| Refresh token                   | Não obrigatório. Pode ser considerado plus.                               | A ementa cobre JWT, mas não necessariamente renovação completa.             |
| Docker Compose                  | Não obrigatório. Pode ser considerado plus.                               | Não consta como conteúdo central da ementa.                                 |
| Arquiteturas complexas          | Não exigir Clean Architecture, DDD ou microsserviços.                     | O foco é API REST, Express, validações, ORM, React e boas práticas básicas. |
| Bibliotecas avançadas de estado | Preferir Context API. Jotai pode ser aceito, mas não exigido.             | Context API foi explicitamente ensinada.                                    |
| Integrações externas reais      | Não obrigatório. Pode haver consumo simples de API externa como plus.     | O núcleo do desafio é CRUD e regras.                                        |

O candidato não deve ser penalizado por não implementar itens fora da ementa.

Priorizar:

- REST.
- JWT.
- RBAC.
- Zod.
- ORM.
- React.
- Formulários.
- Rotas.
- Context API.
- Tratamento de erros.

---

## 4. Contexto do sistema

O fluxo principal do sistema é:

### 4.1 Solicitação

O colaborador cadastra uma solicitação de reembolso informando:

- Categoria.
- Descrição.
- Valor.
- Data da despesa.
- Anexos, quando necessário.

### 4.2 Análise

O gestor visualiza solicitações enviadas e pode:

- Aprovar.
- Rejeitar.

Ao rejeitar, a justificativa é obrigatória.

### 4.3 Pagamento

O financeiro visualiza solicitações aprovadas e marca como pagas.

Solicitações pagas não podem mais ser alteradas.

---

## 5. Perfis de usuário e permissões

Cada usuário deve possuir exatamente um perfil.

### 5.1 COLABORADOR

Pode:

- Criar solicitações.
- Editar solicitações próprias enquanto permitido.
- Visualizar suas próprias solicitações.

Não pode:

- Aprovar solicitações.
- Rejeitar solicitações.
- Pagar solicitações.
- Visualizar solicitações de outros colaboradores.

### 5.2 GESTOR

Pode:

- Visualizar solicitações enviadas.
- Aprovar solicitações.
- Rejeitar solicitações com justificativa.

Não pode:

- Marcar solicitações como pagas.

### 5.3 FINANCEIRO

Pode:

- Visualizar solicitações aprovadas.
- Marcar solicitações aprovadas como pagas.

Não pode:

- Aprovar solicitações.
- Rejeitar solicitações.
- Editar solicitações de reembolso.

### 5.4 ADMIN

Pode:

- Gerenciar usuários.
- Gerenciar categorias.
- Visualizar dados gerais do sistema.

Observação:

- ADMIN não substitui automaticamente o papel operacional de gestor ou financeiro, salvo se essa decisão for documentada.

---

## 6. Entidades mínimas do sistema

Modele, no mínimo, as entidades abaixo.

### 6.1 Usuário

Campos:

- `id`
- `nome`
- `email`
- `senha`
- `perfil`
- `criadoEm`
- `atualizadoEm`

Regras importantes:

- O e-mail deve ter formato válido.
- A senha não deve ser salva em texto puro.
- Cada usuário deve ter exatamente um perfil.

### 6.2 Categoria

Campos:

- `id`
- `nome`
- `ativo`
- `criadoEm`
- `atualizadoEm`

Regras importantes:

- Nome é obrigatório.
- Categoria inativa não pode ser usada em novas solicitações.

### 6.3 Solicitação de Reembolso

Campos:

- `id`
- `solicitanteId`
- `categoriaId`
- `descricao`
- `valor`
- `dataDespesa`
- `status`
- `justificativaRejeicao`
- `criadoEm`
- `atualizadoEm`

Regras importantes:

- O valor deve ser maior que zero.
- A data da despesa é obrigatória.
- A categoria deve existir e estar ativa.
- O status deve seguir as transições permitidas.

### 6.4 Anexo

Campos:

- `id`
- `solicitacaoId`
- `nomeArquivo`
- `urlArquivo`
- `tipoArquivo`
- `criadoEm`

Regras importantes:

- O anexo deve estar vinculado a uma solicitação existente.
- Tipos permitidos devem ser definidos, por exemplo: PDF, JPG e PNG.
- Upload real em storage externo não é obrigatório.

### 6.5 Histórico da Solicitação

Campos:

- `id`
- `solicitacaoId`
- `usuarioId`
- `acao`
- `observacao`
- `criadoEm`

Regras importantes:

- Toda ação importante deve gerar histórico.
- O histórico deve permitir saber quem fez, o que fez, quando fez e qual observação foi associada.

---

## 7. Histórico da solicitação

Toda ação importante executada em uma solicitação deve gerar um registro de histórico.

O histórico funciona como trilha de auditoria.

Cada registro deve armazenar:

- Quem fez.
- Qual ação foi realizada.
- Em qual momento.
- Observação sobre a ação.

### 7.1 Exemplo ao aprovar solicitação

```json
{
  "solicitacaoId": "id-da-solicitacao",
  "usuarioId": "id-do-gestor-logado",
  "acao": "APPROVED",
  "criadoEm": "data/hora atual",
  "observacao": "Solicitação aprovada pelo gestor"
}
```

### 7.2 Exemplo ao pagar solicitação

```json
{
  "solicitacaoId": "id-da-solicitacao",
  "usuarioId": "id-do-financeiro-logado",
  "acao": "PAID",
  "criadoEm": "data/hora atual",
  "observacao": "Pagamento realizado pelo financeiro"
}
```

---

## 8. Status possíveis da solicitação

| Status      | Descrição                                                              | Pode editar?                                                  |
| ----------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| `RASCUNHO`  | Solicitação criada, mas ainda não enviada para análise.                | Sim, apenas pelo colaborador dono.                            |
| `ENVIADO`   | Solicitação enviada para análise do gestor.                            | Não deve ser editada, salvo se outra decisão for justificada. |
| `APROVADO`  | Solicitação aprovada pelo gestor.                                      | Não.                                                          |
| `REJEITADO` | Solicitação rejeitada pelo gestor, obrigatoriamente com justificativa. | Não.                                                          |
| `PAGO`      | Solicitação aprovada e marcada como paga pelo financeiro.              | Não.                                                          |
| `CANCELADO` | Solicitação cancelada pelo colaborador, se ainda permitido.            | Não.                                                          |

---

## 9. Ações possíveis no histórico

| Ação        | Quando registrar                                                                    |
| ----------- | ----------------------------------------------------------------------------------- |
| `CREATED`   | Quando uma solicitação de reembolso for criada.                                     |
| `UPDATED`   | Quando uma solicitação em `RASCUNHO` for alterada pelo colaborador dono.            |
| `SUBMITTED` | Quando uma solicitação mudar de `RASCUNHO` para `ENVIADO`.                          |
| `APPROVED`  | Quando um gestor aprovar uma solicitação `ENVIADA`.                                 |
| `REJECTED`  | Quando um gestor rejeitar uma solicitação `ENVIADA`, com justificativa obrigatória. |
| `PAID`      | Quando o financeiro marcar uma solicitação `APROVADA` como `PAGA`.                  |
| `CANCELED`  | Quando o colaborador cancelar uma solicitação própria, se o status permitir.        |

---

## 10. Regras de negócio detalhadas

As regras abaixo devem ser implementadas explicitamente no backend.

O frontend também deve refletir essas restrições, escondendo ou desabilitando ações quando possível.

### 10.1 Criar solicitação de reembolso

Perfil permitido:

- `COLABORADOR`

Regras:

- O valor deve ser maior que zero.
- A data da despesa é obrigatória.
- A categoria deve existir.
- A categoria deve estar ativa.

Erros esperados:

- `400 Bad Request` para campos inválidos.
- `401 Unauthorized` se o usuário não estiver autenticado.

Ao criar:

- Definir status inicial como `RASCUNHO`.
- Gerar histórico `CREATED`.

### 10.2 Editar solicitação de reembolso

Perfil permitido:

- `COLABORADOR` dono da solicitação.

Regras:

- O colaborador só pode editar solicitações próprias.
- A solicitação só pode ser editada enquanto estiver em `RASCUNHO`.

Erros esperados:

- `403 Forbidden` se não for o dono.
- `400 Bad Request` se o status não permitir edição.
- `404 Not Found` se a solicitação não existir.

Ao editar:

- Gerar histórico `UPDATED`.

### 10.3 Enviar solicitação para análise

Perfil permitido:

- `COLABORADOR` dono da solicitação.

Regras:

- Apenas solicitações em `RASCUNHO` podem ser enviadas.
- Após envio, o status deve mudar para `ENVIADO`.
- Deve gerar histórico `SUBMITTED`.

Erros esperados:

- `400 Bad Request` para transição inválida.
- `403 Forbidden` se não for o dono.
- `404 Not Found` se a solicitação não existir.

### 10.4 Aprovar solicitação

Perfil permitido:

- `GESTOR`

Regras:

- Apenas solicitações com status `ENVIADO` podem ser aprovadas.
- Ao aprovar, o status deve mudar para `APROVADO`.
- Deve gerar histórico `APPROVED`.

Erros esperados:

- `403 Forbidden` para perfil inválido.
- `400 Bad Request` para status inválido.
- `404 Not Found` se a solicitação não existir.

### 10.5 Rejeitar solicitação

Perfil permitido:

- `GESTOR`

Regras:

- Apenas solicitações com status `ENVIADO` podem ser rejeitadas.
- A justificativa de rejeição é obrigatória.
- Ao rejeitar, o status deve mudar para `REJEITADO`.
- Deve gerar histórico `REJECTED`.

Erros esperados:

- `400 Bad Request` se faltar justificativa.
- `400 Bad Request` se o status for inválido.
- `403 Forbidden` para perfil inválido.
- `404 Not Found` se a solicitação não existir.

### 10.6 Marcar solicitação como paga

Perfil permitido:

- `FINANCEIRO`

Regras:

- Apenas solicitações com status `APROVADO` podem ser pagas.
- Ao pagar, o status deve mudar para `PAGO`.
- Deve gerar histórico `PAID`.

Erros esperados:

- `403 Forbidden` para perfil inválido.
- `400 Bad Request` se a solicitação não estiver aprovada.
- `404 Not Found` se a solicitação não existir.

### 10.7 Cancelar solicitação

Perfil permitido:

- `COLABORADOR` dono da solicitação.

Regras:

- O colaborador só pode cancelar solicitações próprias em `RASCUNHO`.
- Opcionalmente, pode cancelar solicitações em `ENVIADO` se essa regra for documentada.
- Ao cancelar, o status deve mudar para `CANCELADO`.
- Deve gerar histórico `CANCELED`.

Erros esperados:

- `400 Bad Request` para status inválido.
- `403 Forbidden` se não for o dono.
- `404 Not Found` se a solicitação não existir.

### 10.8 Criar ou editar categoria

Perfil permitido:

- `ADMIN`

Regras:

- Categoria deve possuir nome obrigatório.
- Categoria inativa não pode ser usada em novas solicitações.

Erros esperados:

- `400 Bad Request` para campos inválidos.
- `403 Forbidden` para perfil inválido.
- `404 Not Found` ao editar categoria inexistente.

### 10.9 Usar categoria em solicitação

Perfil permitido:

- `COLABORADOR`

Regras:

- A categoria informada em uma solicitação deve existir.
- A categoria deve estar ativa.

Erros esperados:

- `400 Bad Request` para categoria inválida ou inativa.

### 10.10 Upload de anexo

Perfil permitido:

- `COLABORADOR` dono da solicitação.

Regras:

- O anexo deve estar vinculado a uma solicitação existente.
- Definir tipos permitidos, por exemplo: PDF, JPG e PNG.

Erros esperados:

- `404 Not Found` se a solicitação não existir.
- `400 Bad Request` para tipo inválido.
- `403 Forbidden` se não for dono da solicitação.

### 10.11 Registro de histórico

Responsável:

- Sistema.

Regras:

- Toda ação relevante deve gerar histórico contendo solicitação, usuário, ação, data/hora e observação.
- A ausência de histórico deve ser considerada falha de implementação.

Importante:

- Não é aceitável retornar sucesso para ações inválidas.
- Exemplo: tentar pagar uma solicitação `ENVIADO` deve retornar erro, e não ignorar a ação nem responder `200`.

---

## 11. Validações obrigatórias

Implementar as seguintes validações:

- `valor` deve ser maior que zero.
- `dataDespesa` é obrigatória.
- `categoriaId` deve ser válido.
- `status` deve ser válido.
- `justificativaRejeicao` é obrigatória ao rejeitar.
- Usuário autenticado é obrigatório para rotas privadas.
- Permissão adequada deve ser validada em cada ação.
- Anexos devem ter tipo de arquivo permitido.
- Transições inválidas de status devem ser bloqueadas.
- E-mail de usuário deve ter formato válido.
- Senha não deve ser salva em texto puro.
- IDs inexistentes devem retornar `404 Not Found`.

---

## 12. Transições de status permitidas

| Origem     | Destino     | Ação                                           | Quem pode fazer    |
| ---------- | ----------- | ---------------------------------------------- | ------------------ |
| `RASCUNHO` | `ENVIADO`   | Enviar para análise                            | `COLABORADOR` dono |
| `ENVIADO`  | `APROVADO`  | Aprovar                                        | `GESTOR`           |
| `ENVIADO`  | `REJEITADO` | Rejeitar com justificativa                     | `GESTOR`           |
| `APROVADO` | `PAGO`      | Marcar como pago                               | `FINANCEIRO`       |
| `RASCUNHO` | `CANCELADO` | Cancelar                                       | `COLABORADOR` dono |
| `ENVIADO`  | `CANCELADO` | Cancelar, se permitido pela regra implementada | `COLABORADOR` dono |

Transições fora desse fluxo devem ser bloqueadas.

---

## 13. Tratamento de erros e boas práticas de API

A API deve retornar respostas HTTP coerentes e mensagens claras.

| Cenário                      | Status HTTP esperado        | Exemplo                                                                              |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Campos inválidos             | `400 Bad Request`           | Valor menor ou igual a zero, data vazia, categoria inválida, justificativa ausente.  |
| Usuário não autenticado      | `401 Unauthorized`          | Token JWT ausente, inválido ou expirado.                                             |
| Usuário sem permissão        | `403 Forbidden`             | Colaborador tentando aprovar, gestor tentando pagar ou financeiro tentando rejeitar. |
| Recurso não encontrado       | `404 Not Found`             | Solicitação, usuário, categoria ou anexo inexistente.                                |
| Transição de status inválida | `400 Bad Request`           | Tentar pagar uma solicitação `ENVIADA` ou rejeitar uma solicitação `PAGA`.           |
| Erro inesperado              | `500 Internal Server Error` | Erro não tratado no servidor.                                                        |

### 13.1 Formato sugerido de erro

```json
{
  "message": "Categoria não encontrada ou inativa",
  "statusCode": 400,
  "error": "Bad Request"
}
```

### 13.2 Comportamento esperado no frontend

O frontend deve:

- Exibir mensagens de erro de forma visual e clara.
- Destacar campos inválidos nos formulários.
- Exibir mensagens de sucesso após ações concluídas.
- Impedir ações não permitidas na interface quando possível.
- Tratar estados de carregamento.
- Tratar estados de erro.
- Tratar lista vazia.
- Não deixar erros técnicos aparecerem crus para o usuário final.
- Redirecionar para login quando o token estiver ausente ou expirado.

---

## 14. Funcionalidades obrigatórias do backend

Implementar:

- API RESTful com Node.js, Express.js e TypeScript.
- Login com JWT.
- Cadastro de usuário.
- Middleware de autenticação.
- Middleware de permissão por perfil.
- Validação de body, params e query params com Zod.
- CRUD de categorias.
- CRUD de solicitações de reembolso.
- Modelagem com Prisma ou Sequelize.
- Manipulação de datas com DayJS ou Intl.
- Upload/listagem simples de anexos, podendo ser simulado.
- Envio da solicitação.
- Aprovação de solicitação.
- Rejeição com justificativa.
- Marcação como pago.
- Listagem do histórico da solicitação.
- Tratamento adequado de erros HTTP.
- Testes de integração com Jest e Supertest para rotas principais.

---

## 15. Funcionalidades obrigatórias do frontend

Implementar o frontend em React usando:

- Functional Components.
- Hooks.
- React Router.
- Context API.
- Uma biblioteca de UI ou SCSS/CSS próprio.

### 15.1 Telas obrigatórias

| Tela                   | Objetivo                                                                       | Cuidados esperados                                                                |
| ---------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Login                  | Autenticar usuário, salvar token e atualizar contexto global de autenticação.  | Exibir erro para credenciais inválidas.                                           |
| Cadastro               | Criar usuário.                                                                 | Validar campos obrigatórios e e-mail.                                             |
| Dashboard/Listagem     | Listar solicitações conforme o perfil usando chamada à API com Axios ou Fetch. | Exibir loading, erro e estado vazio.                                              |
| Nova solicitação       | Criar solicitação de reembolso.                                                | Validar valor, data, categoria e descrição no frontend e tratar erros do backend. |
| Editar solicitação     | Editar solicitação própria em `RASCUNHO`.                                      | Bloquear edição quando o status não permitir.                                     |
| Detalhe da solicitação | Visualizar dados completos, anexos e status.                                   | Mostrar ações disponíveis conforme perfil e status.                               |
| Histórico              | Visualizar trilha de auditoria.                                                | Exibir ação, usuário, data/hora e observação.                                     |
| Aprovação/Rejeição     | Permitir ação do gestor.                                                       | Exigir justificativa ao rejeitar.                                                 |
| Pagamento              | Permitir marcação como pago pelo financeiro.                                   | Permitir apenas solicitações `APROVADAS`.                                         |
| Gestão de categorias   | Admin cria, edita e inativa categorias.                                        | Não permitir uso de categoria inativa em novas solicitações.                      |

---

## 16. Endpoints sugeridos

| Método | Rota                              | Descrição                                      |
| ------ | --------------------------------- | ---------------------------------------------- |
| `POST` | `/auth/login`                     | Autentica usuário e retorna token JWT.         |
| `POST` | `/users`                          | Cria usuário.                                  |
| `GET`  | `/users`                          | Lista usuários. Recomendado para `ADMIN`.      |
| `GET`  | `/categories`                     | Lista categorias.                              |
| `POST` | `/categories`                     | Cria categoria. Recomendado para `ADMIN`.      |
| `PUT`  | `/categories/:id`                 | Atualiza categoria. Recomendado para `ADMIN`.  |
| `GET`  | `/reimbursements`                 | Lista solicitações conforme perfil do usuário. |
| `POST` | `/reimbursements`                 | Cria solicitação de reembolso.                 |
| `GET`  | `/reimbursements/:id`             | Detalha solicitação específica.                |
| `PUT`  | `/reimbursements/:id`             | Edita solicitação quando permitido.            |
| `POST` | `/reimbursements/:id/submit`      | Envia solicitação para análise.                |
| `POST` | `/reimbursements/:id/approve`     | Aprova solicitação enviada.                    |
| `POST` | `/reimbursements/:id/reject`      | Rejeita solicitação enviada com justificativa. |
| `POST` | `/reimbursements/:id/pay`         | Marca solicitação aprovada como paga.          |
| `GET`  | `/reimbursements/:id/history`     | Lista histórico da solicitação.                |
| `POST` | `/reimbursements/:id/attachments` | Faz upload de anexo.                           |
| `GET`  | `/reimbursements/:id/attachments` | Lista anexos da solicitação.                   |

---

## 17. Plus / diferenciais

Os itens abaixo não são obrigatórios, mas são diferenciais positivos se o fluxo principal estiver funcionando:

- Paginação.
- Filtro por status.
- Filtro por categoria.
- Busca por colaborador.
- Ordenação por data ou valor.
- Dashboard com totais.
- Preview/download de anexos.
- Soft delete.
- Seeds iniciais.
- Collection do Postman.
- Mais testes automatizados no backend.
- Mais testes automatizados no frontend.
- Consumo simples de API externa para demonstrar Axios/Fetch, desde que não atrapalhe o escopo principal.
- Refresh token.
- Docker Compose.
- Upload real de comprovantes.
- Limite de valor configurável por categoria.
- Bloqueio de despesas futuras.
- Bloqueio de solicitação sem anexo acima de determinado valor.

Observação:

- Docker, refresh token e upload real não fazem parte do escopo obrigatório.
- Devem contar apenas como diferencial, não como critério eliminatório.

---

## 18. Critérios de avaliação

| Critério                   | O que será observado                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Modelagem de dados         | Entidades, relacionamentos, campos obrigatórios e coerência da estrutura.                 |
| CRUD funcionando           | Criação, leitura, atualização e listagem das entidades principais.                        |
| Autenticação JWT           | Login, proteção de rotas e identificação do usuário logado.                               |
| Express e REST             | Uso correto de rotas, controllers, middlewares, métodos HTTP e status codes.              |
| Zod                        | Validação clara de body, params e query antes das regras de negócio.                      |
| ORM                        | Uso adequado de Prisma ou Sequelize para persistência e relacionamentos.                  |
| RBAC                       | Controle correto de permissões por perfil.                                                |
| Validações                 | Validação de campos obrigatórios, tipos, regras e transições.                             |
| Regras de negócio          | Aplicação correta das regras por entidade, ação, status e perfil.                         |
| Histórico/auditoria        | Registro correto de quem fez, qual ação, quando e observação.                             |
| Tratamento de erros da API | Uso correto de 400, 401, 403, 404 e 500, com mensagens claras.                            |
| Tratamento visual de erros | Exibição de erros, validações, feedbacks de sucesso, loading e estados vazios.            |
| Organização do código      | Separação de responsabilidades, legibilidade, nomes claros e estrutura consistente.       |
| Interface funcional        | Telas usáveis, ações coerentes, formulários claros e navegação simples.                   |
| React Router e Context API | Rotas públicas/privadas, controle de usuário logado, perfil e permissões no frontend.     |
| Testes                     | Testes mínimos com Jest, Supertest e/ou React Testing Library cobrindo fluxos relevantes. |
| Clareza da entrega         | README, instruções de execução e dados de teste.                                          |

---

## 19. Entrega esperada

A entrega deve conter:

- Código fonte em repositório Git.
- README com instruções claras.
- Script ou instrução para rodar o projeto.
- Informações de usuários de teste.
- Explicação das decisões técnicas.
- Informação de quais tecnologias da ementa foram utilizadas.
- Opcional: collection do Postman para facilitar testes da API.
- Lista do que foi implementado e do que ficou pendente, se houver.

A entrega será melhor avaliada se uma pessoa avaliadora conseguir:

1. Clonar o projeto.
2. Rodar localmente.
3. Testar os principais fluxos sem precisar pedir explicações adicionais.

---

## 20. Diretrizes para implementação pela IA da IDE

Ao implementar este projeto, siga estas diretrizes:

1. Comece pela modelagem de dados.
2. Implemente autenticação com JWT antes das rotas privadas.
3. Crie middlewares separados para autenticação e autorização por perfil.
4. Use Zod em todas as entradas relevantes.
5. Centralize tratamento de erros.
6. Nunca retorne `200 OK` para uma ação inválida.
7. Registre histórico em todas as ações relevantes.
8. Implemente primeiro o fluxo principal antes dos diferenciais.
9. Mantenha backend e frontend com responsabilidades separadas.
10. Garanta que o frontend reflita permissões e status da API.
11. Escreva testes mínimos para autenticação, validações, transições de status e permissões.
12. Mantenha o README objetivo e suficiente para execução local.

---

## 21. Fluxo mínimo que deve funcionar

O sistema deve permitir, no mínimo, o seguinte fluxo completo:

1. Criar usuário colaborador.
2. Fazer login como colaborador.
3. Criar uma solicitação em `RASCUNHO`.
4. Editar a solicitação enquanto estiver em `RASCUNHO`.
5. Enviar a solicitação para análise, mudando para `ENVIADO`.
6. Fazer login como gestor.
7. Aprovar a solicitação, mudando para `APROVADO`.
8. Fazer login como financeiro.
9. Marcar a solicitação como paga, mudando para `PAGO`.
10. Consultar o histórico e verificar os registros `CREATED`, `UPDATED`, `SUBMITTED`, `APPROVED` e `PAID`.

Também deve funcionar o fluxo alternativo de rejeição:

1. Colaborador cria e envia solicitação.
2. Gestor rejeita com justificativa obrigatória.
3. Solicitação muda para `REJEITADO`.
4. Histórico registra `REJECTED`.

---

## 22. Observações finais

Priorize simplicidade, clareza e funcionamento correto.

Não adicione complexidade arquitetural desnecessária.

A implementação deve demonstrar domínio de:

- API REST.
- Autenticação.
- Autorização.
- Validação.
- Persistência.
- Regras de negócio.
- Tratamento de erros.
- Interface funcional.
- Testes básicos.
