# Prompt para o Antigravity — Bootstrap do Monorepo Verttex

## Papel do agente

Atue como um **arquiteto de software e engenheiro full stack sênior**, responsável por estruturar o projeto **Verttex** como um monorepo profissional, escalável, padronizado e preparado para desenvolvimento assistido por IA.

Você terá acesso inicialmente a duas pastas irmãs:

```text
./
├── ecokids/
└── verttex/
```

A pasta `ecokids/` contém um projeto existente que poderá ser usado **somente como referência técnica**. A pasta `verttex/` será o novo projeto.

Após o bootstrap, o workspace será fechado e reaberto contendo apenas a pasta `verttex/`. Portanto, o novo projeto deve ficar **completamente autônomo**, sem imports, links, scripts, referências de caminho ou dependências do projeto Ecokids.

---

# 1. Contexto do produto

O projeto real se chama **Verttex**.

A Verttex conecta produtores a pessoas e empresas, permitindo que produtos artesanais, regionais e de origem confiável sejam comercializados pela internet.

Slogan atual:

> Na Verttex, conectamos você ao melhor dos cantos onde a internet não alcança, com produtos artesanais que carregam histórias e sabores únicos.

O sistema será inicialmente estruturado como um e-commerce composto por diferentes aplicações que compartilharão uma única API.

Visão geral:

```text
Manager ───────┐
Storefront ────┼──> API Fastify ───> PostgreSQL
Outros apps ───┘          │
                          └──────────> Cloudflare R2 via S3 API
```

Neste momento, **não implemente regras de negócio, entidades, tabelas, catálogo, pedidos, pagamentos, produtores, clientes ou páginas comerciais**.

O objetivo desta etapa é criar apenas:

- fundação do monorepo;
- aplicações iniciais;
- pacotes compartilhados;
- configurações de qualidade;
- estrutura arquitetural;
- documentação para humanos e agentes de IA;
- contratos técnicos básicos;
- rota técnica de health check;
- páginas mínimas necessárias para validar o build dos frontends.

Não invente regras de negócio que ainda não foram fornecidas.

---

# 2. Prioridade das instruções

Use a seguinte ordem de prioridade:

1. Regras deste documento.
2. Documentação criada dentro de `.ai/` no projeto Verttex.
3. Decisões arquiteturais registradas durante o bootstrap.
4. Padrões técnicos úteis encontrados no Ecokids.
5. Convenções padrão das bibliotecas utilizadas.

Caso o Ecokids tenha uma implementação que conflite com este documento, **as regras da Verttex prevalecem**.

Não copie cegamente o projeto Ecokids.

---

# 3. Processo obrigatório antes da implementação

Antes de criar ou alterar arquivos dentro de `verttex/`:

1. Analise a estrutura do projeto `ecokids/`.
2. Identifique padrões reutilizáveis de:
   - Turborepo;
   - pnpm workspaces;
   - scripts;
   - TypeScript;
   - ESLint;
   - Prettier;
   - organização de apps e packages;
   - Fastify;
   - Prisma;
   - Next.js;
   - variáveis de ambiente;
   - contratos compartilhados;
   - respostas HTTP;
   - documentação para IA.
3. Não copie:
   - regras de negócio;
   - tabelas ou migrations;
   - nomes de domínio;
   - marcas;
   - secrets;
   - arquivos `.env` reais;
   - IDs;
   - URLs privadas;
   - credenciais;
   - chaves de serviços;
   - código específico do Ecokids sem necessidade arquitetural.
4. Crie o arquivo `.ai/BOOTSTRAP_PLAN.md` contendo:
   - estrutura que será criada;
   - padrões do Ecokids que serão adaptados;
   - padrões que serão descartados;
   - decisões próprias adotadas para a Verttex;
   - riscos e observações.
5. Só depois execute o bootstrap.

Crie também `.ai/ECOKIDS_REFERENCE.md` registrando, de forma objetiva, quais ideias técnicas foram adaptadas do Ecokids. Esse arquivo não pode criar dependência operacional entre os projetos.

---

# 4. Stack obrigatória

## 4.1 Monorepo

- Turborepo.
- pnpm workspaces.
- Node.js LTS.
- TypeScript em modo estrito.
- Um único lockfile na raiz.
- Não usar npm ou Yarn.

Use versões exatas no lockfile e mantenha versões compartilhadas centralizadas, preferencialmente por meio de `pnpm catalogs`, quando isso não prejudicar a clareza do projeto.

## 4.2 Frontend

- Next.js LTS.
- React compatível com a versão LTS escolhida do Next.js.
- Tailwind CSS `4.3.x`.
- `shadcn/ui`:
  - estilo `New York`;
  - base color `zinc`.
- TanStack Query LTS com `@tanstack/react-query`.
- React Hook Form.
- Zod resolvers.
- React Icons.

### Decisão obrigatória sobre roteamento

Os aplicativos Next.js devem usar o **App Router nativo do Next.js**.

Não instale nem use `react-router-dom` ou `createBrowserRouter` dentro dos apps Next.js. React Router só poderá ser utilizado futuramente se for criado um aplicativo SPA que não use Next.js.

### Regras de frontend

- Server Components por padrão.
- Client Components somente quando houver necessidade real de estado, eventos, browser APIs, formulários interativos ou TanStack Query.
- Não transformar toda a aplicação em Client Component.
- Não criar APIs de negócio em Route Handlers do Next.js; a API de negócio pertence ao Fastify.
- O diretório `app/` deve ser fino e focado em roteamento, layouts e composição de features.
- Código de domínio de interface deve ficar organizado por feature.
- Componentes reutilizáveis entre aplicações devem ir para `@verttex/ui`.
- Componentes específicos de um app devem permanecer dentro do app.
- Não duplicar componentes equivalentes entre `manager` e `storefront`.
- TanStack Query deve ser usado para estado de servidor no cliente, não para substituir Server Components sem necessidade.
- Formulários devem usar React Hook Form + schemas Zod compartilháveis quando fizer sentido.
- Todo padrão repetível de página, formulário, tabela, modal, feedback, loading, empty state e erro deve ser documentado em `.ai/FRONTEND_UI.md` antes de ser replicado em larga escala.

## 4.3 Backend

- Fastify `5.10.x`.
- Zod Type Provider.
- Prisma `7.8.0`.
- PostgreSQL.
- JWT com `@fastify/jwt`.
- Cookies com `@fastify/cookie`.
- CASL para autorização.
- Cloudflare R2 por meio de wrapper compatível com S3 API.
- Swagger com:
  - `@fastify/swagger`;
  - `@fastify/swagger-ui`;
  - documentação disponível em `/docs`.
- `tsup` para build.
- `tsx watch` para desenvolvimento.

Nenhum fluxo de autenticação ou autorização real deve ser inventado nesta etapa. Apenas prepare a arquitetura e os pontos de extensão.

---

# 5. Estrutura desejada do monorepo

Crie uma estrutura equivalente à seguinte. Ajustes são permitidos quando tecnicamente justificados e documentados, mas não crie abstrações desnecessárias.

```text
verttex/
├── .ai/
│   ├── AGENT.md
│   ├── ARCHITECTURE.md
│   ├── BACKEND_API.md
│   ├── BOOTSTRAP_PLAN.md
│   ├── BUSINESS_RULES.md
│   ├── ECOKIDS_REFERENCE.md
│   ├── FRONTEND_UI.md
│   └── WORKFLOWS.md
├── .github/
│   └── workflows/
├── apps/
│   ├── api/
│   ├── manager/
│   └── storefront/
├── packages/
│   ├── auth/
│   ├── env/
│   ├── types/
│   └── ui/
├── config/
│   ├── eslint/
│   ├── prettier/
│   └── typescript/
├── AGENTS.md
├── compose.yaml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json
├── .editorconfig
├── .gitignore
├── .npmrc
├── README.md
└── demais arquivos estritamente necessários
```

## 5.1 Aplicações

### `apps/api`

API principal em Fastify.

### `apps/manager`

Painel administrativo e operacional da Verttex.

Nesta etapa, crie apenas o app, providers necessários, layout técnico mínimo e uma página placeholder suficiente para validar o build.

### `apps/storefront`

Loja pública voltada ao consumidor e empresas compradoras.

Nesta etapa, crie apenas o app, providers necessários, layout técnico mínimo e uma página placeholder suficiente para validar o build.

Não criar “outros apps” agora. A arquitetura deve permitir adicioná-los posteriormente.

---

# 6. Estrutura recomendada para a API

Use uma arquitetura de **monólito modular orientada a features**, simples de navegar e sem excesso de camadas vazias.

Estrutura base recomendada:

```text
apps/api/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── @types/
│   │   ├── fastify.d.ts
│   │   └── process-env.d.ts
│   ├── config/
│   │   └── index.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── prisma.ts
│   │   └── storage/
│   │       └── r2.ts
│   ├── modules/
│   │   ├── health/
│   │   │   ├── health.controller.ts
│   │   │   ├── health.routes.ts
│   │   │   └── health.schemas.ts
│   │   └── index.ts
│   ├── plugins/
│   │   ├── auth.ts
│   │   ├── cookie.ts
│   │   ├── cors.ts
│   │   ├── jwt.ts
│   │   ├── request-context.ts
│   │   └── swagger.ts
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   ├── error-codes.ts
│   │   │   └── http-error-handler.ts
│   │   ├── http/
│   │   │   ├── pagination.ts
│   │   │   └── response.ts
│   │   ├── hooks/
│   │   └── utils/
│   ├── app.ts
│   └── server.ts
├── tests/
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## 6.1 Regras da arquitetura backend

- Organize funcionalidades por domínio dentro de `src/modules/`.
- Cada módulo deve possuir apenas os arquivos e camadas que realmente utiliza.
- Não criar `repository`, `service`, `use-case`, `mapper` ou `factory` vazios apenas para satisfazer um diagrama.
- Rotas devem ser responsáveis por registrar método, URL, schema, segurança e controller.
- Controllers devem converter HTTP em chamada de aplicação e retornar o contrato padronizado.
- Regras de negócio futuras devem ficar fora dos controllers.
- Acesso a banco não deve ocorrer diretamente dentro de routes.
- Prisma deve ser encapsulado por um singleton na infraestrutura.
- O wrapper de R2 deve ficar isolado na infraestrutura.
- Plugins Fastify devem ser registrados explicitamente em uma ordem documentada.
- `app.ts` deve construir e configurar a aplicação sem iniciar a porta.
- `server.ts` deve carregar ambiente, iniciar a aplicação e controlar shutdown gracioso.
- Rotas devem usar Zod para `body`, `params`, `querystring`, headers e responses quando aplicável.
- O Swagger deve ser gerado a partir dos schemas das rotas.
- Não retornar stack trace ou detalhes internos em produção.
- Toda requisição deve possuir um `requestId` utilizável em logs e erros.

## 6.2 Evolução futura dos módulos

Quando módulos reais forem adicionados, use como referência:

```text
src/modules/<domain>/
├── <domain>.routes.ts
├── <domain>.controller.ts
├── <domain>.schemas.ts
├── <domain>.service.ts        # apenas quando necessário
├── <domain>.repository.ts     # apenas quando necessário
└── index.ts
```

Módulos complexos poderão evoluir para subpastas `application`, `domain`, `infrastructure` e `http`, mas isso só deve ocorrer quando a complexidade justificar. Evite começar com uma arquitetura excessivamente fragmentada.

---

# 7. Estrutura recomendada para os frontends

Use a mesma convenção em `apps/manager` e `apps/storefront`.

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── globals.css
├── components/
│   └── app/
├── features/
├── hooks/
├── lib/
│   ├── api/
│   ├── query/
│   └── utils/
├── providers/
│   └── query-provider.tsx
└── types/
```

## 7.1 Regras da estrutura frontend

- `app/`: rotas, layouts, metadata, loading, error boundaries e composição.
- `features/`: componentes, hooks, schemas e integrações específicas de cada feature.
- `components/app/`: componentes reutilizáveis apenas dentro daquele app.
- `@verttex/ui`: componentes visuais compartilhados por dois ou mais apps.
- `lib/api/`: cliente HTTP e configuração de acesso à API.
- `providers/`: providers client-side estritamente necessários.
- Não criar uma pasta genérica `services/` que vire depósito de funções sem domínio.
- Não criar barrels internos em todos os diretórios. Use barrels principalmente em entrypoints públicos de packages.
- Evite imports cruzados entre features.
- Não importar arquivos internos de outro app.

---

# 8. Packages compartilhados

## 8.1 `@verttex/auth`

Responsabilidade:

- tipos e helpers de autorização;
- integração com CASL;
- definições de actions;
- definição de subjects;
- criação e verificação de abilities.

Nesta etapa:

- prepare a estrutura;
- não invente roles, cargos ou permissões comerciais;
- use placeholders técnicos claramente documentados;
- não acople o pacote ao Fastify ou ao React quando não for necessário.

## 8.2 `@verttex/env`

Responsabilidade:

- validação tipada de variáveis de ambiente;
- separar ambiente de frontend, backend e compartilhado;
- impedir leitura de variáveis não validadas espalhada pelo projeto.

Use adapters apropriados:

- `@t3-oss/env-nextjs` para aplicações Next.js;
- `@t3-oss/env-core` para a API Node.js, caso necessário;
- entrypoints explícitos, por exemplo:
  - `@verttex/env/api`;
  - `@verttex/env/manager`;
  - `@verttex/env/storefront`.

Nunca expor variáveis privadas do servidor para o browser.

## 8.3 `@verttex/types`

Apesar do nome `types`, este pacote deve ser utilizado principalmente como pacote de **contratos compartilhados em runtime**.

Responsabilidade:

- schemas Zod compartilhados;
- tipos inferidos dos schemas;
- contratos de request e response;
- schemas de erro;
- schemas de paginação;
- tipos utilitários comuns.

Evite criar interfaces TypeScript duplicadas quando um schema Zod puder ser a fonte de verdade.

O pacote não deve importar código dos apps.

## 8.4 `@verttex/ui`

Responsabilidade:

- primitives do `shadcn/ui`;
- componentes reutilizáveis entre os frontends;
- tokens visuais compartilhados;
- feedback visual, incluindo toast quando for implementado;
- helpers de composição de classes.

Configuração:

- estilo `New York`;
- base `zinc`;
- Tailwind CSS compatível com a versão escolhida;
- React Icons como biblioteca de ícones do projeto.

Não adicionar uma grande biblioteca de componentes sem uso. Inicialmente, crie apenas a infraestrutura e os poucos componentes necessários para validar integração e build.

---

# 9. Configurações compartilhadas

As configurações de desenvolvimento devem ficar em `config/*`, mas cada diretório deve ser um workspace package com nome próprio.

## 9.1 ESLint

Diretório:

```text
config/eslint/
```

Package name:

```text
@verttex/eslint-config
```

Requisitos:

- estender `@rocketseat/eslint-config` quando compatível com a stack;
- configurar TypeScript;
- configurar Next.js nos apps frontend;
- usar `eslint-plugin-simple-import-sort`;
- aplicar regras de imports e exports deste documento;
- não desativar regras globalmente sem justificativa documentada.

## 9.2 Prettier

Arquivo central obrigatório:

```text
config/prettier/index.mjs
```

Package name:

```text
@verttex/prettier
```

Configuração obrigatória:

```js
{
  semi: false,
  singleQuote: true,
  trailingComma: 'es5'
}
```

Adicionar o plugin oficial de ordenação de classes do Tailwind compatível com a versão utilizada.

## 9.3 TypeScript

Diretório:

```text
config/typescript/
```

Package name:

```text
@verttex/tsconfig
```

Disponibilizar configurações, no mínimo, para:

- base;
- Node.js;
- Next.js;
- biblioteca;

Ativar `strict` e evitar `any`. Considere também `noUncheckedIndexedAccess`, desde que a decisão seja aplicada de forma consistente e documentada.

---

# 10. Convenções rígidas de código

## 10.1 Migrations do banco de dados

Preservar o histórico do schema é obrigatório.

### Proibido

Nunca executar:

```bash
prisma db push
prisma db reset
```

Também é proibido:

- excluir manualmente migrations para “corrigir” histórico;
- editar migrations já aplicadas sem uma estratégia formal;
- sincronizar schema diretamente em banco compartilhado;
- recriar banco como atalho para resolver divergências.

### Obrigatório

Toda mudança de schema deve gerar migration por:

```bash
pnpm db:migrate
```

Esse comando deve chamar internamente:

```bash
prisma migrate dev
```

Todas as migrations geradas em `prisma/migrations` devem ser versionadas.

Como ainda não existem entidades, não crie tabelas artificiais apenas para gerar uma migration inicial.

## 10.2 Imports

Ordenação automática por `eslint-plugin-simple-import-sort`:

1. React e bibliotecas externas.
2. Workspace packages, como `@verttex/ui` e `@verttex/types`.
3. Aliases do app, como `@/...`.
4. Arquivos relativos, como `./...` e `../...`.

Não ordenar imports manualmente de forma conflitante com o ESLint.

## 10.3 Exports

- Usar **named exports** em componentes, hooks, funções, utilities, schemas, rotas, controllers e actions.
- Default export somente onde o framework exigir ou no root `App` de um aplicativo SPA futuro.
- Em arquivos especiais do Next.js, usar default export apenas porque o framework exige para `page`, `layout`, `loading`, `error` e arquivos equivalentes.
- Entry points públicos de packages devem usar barrel re-exports:

```ts
export * from './...'
```

- Não usar default exports arbitrários.

## 10.4 Nomenclatura

- Arquivos: `kebab-case`.
- Componentes e tipos: `PascalCase`.
- Funções, variáveis e hooks: `camelCase`.
- Constantes realmente globais: `SCREAMING_SNAKE_CASE`.
- Hooks devem começar com `use`.
- Schemas Zod devem terminar com `Schema`.
- Tipos inferidos devem possuir nome sem sufixos redundantes quando o contexto for claro.
- Rotas, controllers e serviços devem seguir padrão idêntico entre módulos.

## 10.5 Qualidade

- Evitar `any`.
- Evitar `as unknown as`.
- Evitar `eslint-disable` sem comentário objetivo.
- Evitar abstrações antes de existir repetição real.
- Não duplicar schemas entre API e frontend.
- Não acessar `process.env` diretamente fora do package de ambiente e bootstrap estritamente necessário.
- Não expor mensagens internas de banco, storage ou stack trace ao cliente.
- Não deixar código morto, TODO genérico ou exemplos não utilizados.

---

# 11. Contratos padronizados da API

Crie os schemas compartilhados em `@verttex/types` e helpers de resposta na API.

## 11.1 Resposta de sucesso simples

```json
{
  "success": true,
  "data": {}
}
```

Schema conceitual:

```ts
type ApiSuccess<T> = {
  success: true
  data: T
}
```

## 11.2 Resposta de sucesso sem conteúdo relevante

Preferir HTTP `204` sem body quando semanticamente correto.

Quando for necessário retornar confirmação estruturada:

```json
{
  "success": true,
  "data": {
    "message": "Operação realizada com sucesso"
  }
}
```

Não misturar aleatoriamente endpoints que retornam `{ message }`, `{ data }`, objetos crus ou arrays crus.

## 11.3 Lista sem paginação

```json
{
  "success": true,
  "data": [
    {}
  ]
}
```

## 11.4 Lista paginada

Use inicialmente paginação por página e limite como único padrão oficial.

```json
{
  "success": true,
  "data": [
    {}
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Schema conceitual:

```ts
type PaginationMeta = {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

type ApiPaginatedSuccess<T> = {
  success: true
  data: T[]
  meta: PaginationMeta
}
```

Não implementar paginação por cursor nesta etapa. Se for necessária futuramente, crie um contrato separado e documentado, sem alterar silenciosamente o contrato atual.

## 11.5 Resposta de erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Os dados enviados são inválidos",
    "details": null,
    "fieldErrors": {
      "email": [
        "Informe um e-mail válido"
      ]
    },
    "requestId": "req_123"
  }
}
```

Schema conceitual:

```ts
type ApiError = {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
    fieldErrors?: Record<string, string[]>
    requestId: string
  }
}
```

Regras:

- `code` é estável e utilizado pelo frontend.
- `message` é segura para exibição ou tratamento.
- `fieldErrors` é usado para erros de validação de formulário.
- `details` só deve existir quando houver informação segura e útil.
- `requestId` deve permitir correlação com logs.
- O frontend não deve depender de mensagens textuais para identificar o tipo de erro.

Códigos HTTP mínimos padronizados:

- `400`: validação ou requisição inválida.
- `401`: não autenticado.
- `403`: sem permissão.
- `404`: recurso não encontrado.
- `409`: conflito de estado ou unicidade.
- `422`: regra semântica específica, somente se o projeto decidir adotá-la de forma consistente.
- `429`: limite de requisições.
- `500`: erro interno não exposto.

Crie um catálogo inicial de códigos técnicos, sem inventar códigos de negócio.

---

# 12. Cliente HTTP dos frontends

Prepare um cliente HTTP compartilhável ou uma base clara para sua criação futura.

Regras:

- A origem da API deve vir de ambiente validado.
- O cliente deve entender `ApiSuccess`, `ApiPaginatedSuccess` e `ApiError`.
- Erros devem ser normalizados antes de chegar às features.
- Não espalhar `fetch` configurado manualmente por páginas e componentes.
- Não armazenar access token em `localStorage`.
- Autenticação futura deverá priorizar cookies seguros, `httpOnly`, `secure` e `sameSite`, conforme o fluxo que será definido depois.
- Não implementar login agora.

Não crie um package `@verttex/api-client` vazio nesta etapa. Só crie esse package se houver código real compartilhado por mais de um frontend. Caso contrário, documente a futura extração.

---

# 13. Prisma e PostgreSQL

Prepare o Prisma no `apps/api`, sem criar modelos de negócio.

O `schema.prisma` deve conter apenas o necessário para configurar:

- client generator;
- datasource PostgreSQL;
- caminho de ambiente validado conforme compatibilidade do Prisma adotado.

Scripts mínimos:

```text
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

Os scripts da raiz devem delegar corretamente para `apps/api`.

O projeto deve possuir `compose.yaml` para ambiente PostgreSQL local, sem secrets reais. Use valores de desenvolvimento claramente identificados e documentados no `.env.example` apropriado.

Não executar reset automático do banco em scripts de desenvolvimento.

---

# 14. Cloudflare R2

Crie apenas a fundação do wrapper S3 compatível com Cloudflare R2.

Requisitos:

- isolamento em `apps/api/src/infrastructure/storage/`;
- configuração por ambiente validado;
- interface preparada para upload, leitura e remoção futuras;
- sem upload real obrigatório nesta etapa;
- sem credenciais reais;
- sem acoplamento de domínio.

Documente em `.ai/BACKEND_API.md` como o wrapper deverá ser utilizado futuramente.

---

# 15. Documentação obrigatória em `.ai/`

A documentação é parte do produto e deve ser tratada como fonte de verdade.

## 15.1 `.ai/AGENT.md`

Deve explicar aos agentes:

- contexto do projeto;
- ordem de leitura dos documentos;
- comandos permitidos;
- comandos proibidos;
- obrigação de consultar `.ai/*.md` antes de mudanças;
- obrigação de atualizar documentação quando um padrão mudar;
- política de migrations;
- política de exports;
- política de imports;
- como criar novos apps, packages e módulos;
- proibição de inventar regras de negócio.

Crie também um `AGENTS.md` curto na raiz apontando explicitamente para `.ai/AGENT.md` e para a ordem de leitura dos arquivos.

## 15.2 `.ai/ARCHITECTURE.md`

Documentar:

- visão geral do sistema;
- monorepo;
- apps;
- packages;
- configs;
- dependências permitidas entre camadas;
- fluxo frontend → API → banco/storage;
- decisões do App Router;
- arquitetura modular da API;
- regras para extração de packages;
- diagrama Mermaid simples.

## 15.3 `.ai/BUSINESS_RULES.md`

Nesta etapa, registrar apenas:

- propósito do produto;
- público geral esperado;
- slogan;
- escopo ainda não definido;
- lista explícita de regras que não podem ser inventadas.

Deixar seções preparadas para regras futuras, mas não preencher com suposições.

## 15.4 `.ai/BACKEND_API.md`

Documentar:

- estrutura da API;
- padrão de módulos;
- padrão de rota;
- padrão de schemas;
- padrão de controllers;
- padrão de erros;
- respostas simples;
- paginação;
- Swagger;
- autenticação futura;
- CASL;
- Prisma;
- migrations;
- R2;
- health check;
- exemplos mínimos de código.

## 15.5 `.ai/FRONTEND_UI.md`

Documentar:

- Next App Router;
- Server e Client Components;
- organização por features;
- componentes compartilhados;
- shadcn/ui;
- Tailwind;
- formulários;
- TanStack Query;
- cliente HTTP;
- estados de loading, erro e vazio;
- padrões de acessibilidade;
- política de responsividade;
- política de ícones;
- regras para não duplicar UI.

## 15.6 `.ai/WORKFLOWS.md`

Documentar os fluxos de desenvolvimento:

- instalar dependências;
- rodar todos os apps;
- rodar um app isolado;
- lint;
- typecheck;
- build;
- format;
- criar migration;
- gerar Prisma Client;
- adicionar componente shadcn;
- criar package;
- criar módulo Fastify;
- criar rota;
- criar variável de ambiente;
- atualizar documentação.

---

# 16. Scripts da raiz

Crie scripts consistentes, no mínimo:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "clean": "turbo clean",
    "db:generate": "pnpm --filter @verttex/api db:generate",
    "db:migrate": "pnpm --filter @verttex/api db:migrate",
    "db:studio": "pnpm --filter @verttex/api db:studio"
  }
}
```

Ajuste apenas quando necessário para compatibilidade real.

Configure o Turborepo para entender corretamente:

- outputs de build;
- dependências entre tasks;
- variáveis de ambiente relevantes;
- cache;
- tasks persistentes de desenvolvimento.

---

# 17. Aliases e dependências entre workspaces

Utilize alias `@/*` apenas para imports internos de cada app.

Use packages do workspace por nome:

```ts
import { ... } from '@verttex/types'
import { ... } from '@verttex/ui'
```

Regras de dependência:

- apps podem importar packages;
- packages não podem importar apps;
- `@verttex/types` não pode depender de frontend ou Fastify;
- `@verttex/ui` pode depender de React, mas não da API;
- `@verttex/auth` deve permanecer independente de infraestrutura sempre que possível;
- configs não devem importar apps;
- um app não deve importar outro app.

Use protocolo workspace:

```json
"@verttex/types": "workspace:*"
```

---

# 18. Ambiente e arquivos `.env`

Crie apenas arquivos de exemplo:

- `.env.example` na raiz quando houver variável verdadeiramente global;
- `apps/api/.env.example`;
- `apps/manager/.env.example`;
- `apps/storefront/.env.example`.

Não criar `.env` com secrets reais.

Variáveis devem ser:

- validadas por Zod;
- documentadas;
- separadas entre servidor e browser;
- expostas ao browser apenas com prefixo apropriado do Next.js;
- lidas por entrypoints do `@verttex/env`.

---

# 19. GitHub Actions

Crie um workflow inicial simples em `.github/workflows/ci.yml` que execute:

1. checkout;
2. instalação do pnpm;
3. configuração do Node LTS;
4. instalação com lockfile congelado;
5. lint;
6. typecheck;
7. build.

Não configure deploy nesta etapa.

Use cache compatível com pnpm e Turborepo quando apropriado, sem depender de secrets obrigatórios para a pipeline básica.

---

# 20. Implementações mínimas obrigatórias

## 20.1 API

Criar:

- `GET /health`;
- resposta dentro do contrato padronizado;
- status da aplicação;
- timestamp;
- versão da API quando disponível;
- Swagger em `/docs`;
- error handler global;
- request ID;
- shutdown gracioso.

Exemplo esperado:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

Não faça o health check depender obrigatoriamente do banco nesta primeira etapa. Se criar uma verificação de infraestrutura, separe `liveness` de `readiness` e documente.

## 20.2 Manager

Criar apenas:

- layout raiz;
- metadata básica da Verttex;
- provider do TanStack Query;
- página técnica indicando que o app foi inicializado;
- integração mínima com `@verttex/ui` para validar o package;
- estados `loading.tsx` e `error.tsx` básicos quando fizer sentido.

## 20.3 Storefront

Criar apenas:

- layout raiz;
- metadata básica da Verttex;
- provider do TanStack Query;
- página técnica indicando que o app foi inicializado;
- integração mínima com `@verttex/ui` para validar o package;
- estados `loading.tsx` e `error.tsx` básicos quando fizer sentido.

Essas páginas são placeholders técnicos, não páginas de produto.

---

# 21. O que não deve ser feito nesta etapa

Não implementar:

- usuários reais;
- produtores;
- clientes;
- empresas compradoras;
- produtos;
- categorias;
- estoque;
- pedidos;
- pagamentos;
- entregas;
- comissão;
- marketplace;
- carrinho;
- checkout;
- autenticação completa;
- recuperação de senha;
- RBAC inventado;
- permissões inventadas;
- upload real;
- integração de pagamento;
- e-mails;
- páginas de catálogo;
- dashboard comercial;
- seed de negócio;
- tabelas temporárias;
- mocks de domínio que possam ser confundidos com especificação oficial.

Não usar dados do Ecokids como placeholder de negócio.

---

# 22. Critérios de aceite

O bootstrap só estará concluído quando:

- `verttex/` funcionar sem a pasta `ecokids/` aberta.
- `pnpm install --frozen-lockfile` funcionar após o lockfile existir.
- `pnpm lint` passar.
- `pnpm typecheck` passar.
- `pnpm build` passar.
- os apps `api`, `manager` e `storefront` iniciarem individualmente.
- a API responder em `/health`.
- o Swagger abrir em `/docs`.
- os frontends consumirem packages do workspace corretamente.
- a configuração de Prettier central estiver ativa.
- a ordenação de imports estiver ativa.
- os exports seguirem o padrão definido.
- nenhum app importar outro app.
- não houver dependência de caminho para o Ecokids.
- não houver secret real versionado.
- não houver tabela ou regra de negócio inventada.
- toda documentação `.ai/` estiver criada e coerente com o código.
- o README explicar como iniciar o ambiente local.
- os comandos de migration seguros estiverem configurados.
- os comandos proibidos estiverem documentados.

---

# 23. Validação final obrigatória

Ao terminar:

1. Execute instalação, lint, typecheck e build.
2. Corrija todos os erros encontrados.
3. Confira se não existem referências textuais indevidas a `ecokids` fora de `.ai/ECOKIDS_REFERENCE.md` e `.ai/BOOTSTRAP_PLAN.md`.
4. Confira se não existem secrets copiados.
5. Confira se não existem imports entre apps.
6. Confira se a documentação corresponde ao código criado.
7. Não informe que algo funciona sem executar a validação correspondente.

Se algum comando não puder ser executado por limitação real do ambiente, registre exatamente:

- comando não executado;
- motivo;
- arquivos potencialmente afetados;
- passo manual necessário.

---

# 24. Formato da resposta final do agente

Ao concluir, responda com um relatório objetivo contendo:

## Estrutura criada

Resumo dos apps, packages, configs e documentos.

## Decisões arquiteturais

Lista das decisões mais importantes e respectivas justificativas.

## Referências aproveitadas do Ecokids

Somente padrões técnicos realmente adaptados.

## Comandos executados

Lista com resultado de:

- instalação;
- lint;
- typecheck;
- build;
- demais validações.

## Arquivos principais

Lista dos arquivos mais importantes criados ou modificados.

## Divergências

Qualquer ponto deste prompt que precisou ser ajustado por incompatibilidade técnica, com justificativa clara.

## Próxima etapa recomendada

Indicar apenas os próximos artefatos necessários para iniciar a modelagem de negócio, sem implementá-los agora.

---

# 25. Orientação de execução

Não peça confirmação para decisões triviais de scaffold.

Escolha defaults profissionais, mantenha a estrutura simples e registre decisões relevantes na documentação.

Não faça uma cópia literal do Ecokids. Use-o como referência para acelerar a criação de uma base melhor, mais consistente e totalmente alinhada à Verttex.

Comece agora pela análise do Ecokids e pela criação de `.ai/BOOTSTRAP_PLAN.md`. Depois implemente e valide todo o bootstrap do projeto Verttex.
