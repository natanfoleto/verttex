# Central de Documentação — VERTTEX

> **Repositório de Conhecimento e Guias do Ecossistema VERTTEX NF**  
> **Localização:** `.ai/`

Bem-vindo à central oficial de documentação do projeto VERTTEX NF. Toda a documentação técnica, regras de negócio, arquitetura, políticas de segurança e roadmaps de execução estão organizados nesta pasta.

---

## 1. Hierarquia Oficial de Documentos

Quando for necessário ler ou consultar informações sobre o projeto, siga esta hierarquia oficial (da maior prioridade para a menor):

1. [`.ai/AGENT.md`](./AGENT.md) — Diretrizes globais e regras para IAs e desenvolvedores
2. [`.ai/security/`](./security/README.md) — Políticas e regras técnicas de segurança (prioridade máxima sobre conveniência de código)
3. **Roadmap ativo** em [`.ai/roadmaps/active/`](./roadmaps/active/) — O que está sendo desenvolvido no momento
4. [`.ai/roadmaps/INDEX.md`](./roadmaps/INDEX.md) — Índice consolidado de todos os roadmaps
5. [`.ai/architecture/`](./architecture/README.md) — Arquitetura vigente, topologia e ADRs
6. [`.ai/domain/`](./domain/README.md) — Regras de negócio, modelos de dados, permissões e fluxos
7. [`.ai/backend/`](./backend/README.md) e [`.ai/frontend/FRONTEND_UI.md`](./frontend/FRONTEND_UI.md) — Documentação técnica de API e UI (contendo a **Regra Canônica de Uso do Shadcn UI §10.13**)
8. [`.ai/observability/`](./observability/README.md) — Regras de auditoria e logging
9. [`.ai/planning/`](./planning/README.md) — Planejamento preliminar e estudos não formalizados como roadmap
10. [`.ai/archive/`](./archive/README.md) — Documentos descontinuados ou substituídos

---

## 2. Estrutura das Categorias

Toda a documentação do projeto está dividida nas seguintes categorias oficiais:

```text
.ai/
├── README.md               — Este arquivo (índice central)
├── AGENT.md                — Diretrizes globais da IA e ordem de leitura
│
├── architecture/           — Arquitetura do sistema, monorepo e ADRs
│   ├── README.md
│   ├── ARCHITECTURE.md
│   └── decisions/
│
├── backend/                — API Fastify, rotas, schemas Zod, Prisma e backend
│   ├── README.md
│   └── BACKEND_API.md
│
├── frontend/               — Interface de usuário Next.js (Manager e Marketplace)
│   ├── README.md
│   └── FRONTEND_UI.md
│
├── domain/                 — Regras de negócio, permissões funcionais e fluxos
│   ├── README.md
│   ├── BUSINESS_RULES.md
│   ├── PERMISSIONS.md
│   └── WORKFLOWS.md
│
├── observability/          — Auditoria, rastreabilidade e log audit
│   ├── README.md
│   └── AUDIT_RULES.md
│
├── planning/               — Estudos preliminares e bootstrap inicial
│   ├── README.md
│   └── BOOTSTRAP_PLAN.md
│
├── roadmaps/               — Roadmaps oficiais de execução (subdivididos por status)
│   ├── README.md
│   ├── INDEX.md
│   ├── active/             — Roadmap atualmente em execução
│   ├── planned/            — Roadmaps planejados e aprovados
│   ├── completed/          — Roadmaps totalmente concluídos e validados
│   └── archived/           — Roadmaps cancelados ou substituídos
│
├── security/               — Programa completo de segurança (OWASP ASVS 5.0 / NIST SSDF)
│   ├── README.md
│   └── (20 documentos de políticas, threat model, matrizes e verificações)
│
└── archive/                — Arquivo geral de documentos descontinuados
    └── README.md
```

---

## 3. Gestão de Roadmaps

Os roadmaps oficiais de execução estão localizados em [`.ai/roadmaps/`](./roadmaps/README.md).

- [`.ai/roadmaps/INDEX.md`](./roadmaps/INDEX.md) é o índice consolidado com o status real de cada entrega.
- `active/`: Contém o roadmap em execução (regra: apenas 1 ativo por vez).
- `planned/`: Contém os roadmaps planejados e prontos para iniciar.
- `completed/`: Contém os roadmaps concluídos e validados com testes e evidências.
- `archived/`: Contém os roadmaps cancelados ou descontinuados.

> **Importante:** `.ai/planning/` armazena estudos preliminares e não substitui os roadmaps oficiais em `.ai/roadmaps/`.

---

## 4. Tratamento de Conflitos Documentais

Quando houver divergência entre dois ou mais documentos:

1. Não escolher silenciosamente um deles.
2. Identificar quais documentos estão envolvidos.
3. Comparar as afirmações com a implementação real no código-fonte.
4. Caso haja evidência clara no código de qual é a versão vigente, atualizar o documento desatualizado.
5. Caso persista ambiguidade ou dúvida de negócio, solicitar decisão humana e registrar a resolução em `.ai/architecture/decisions/` ou `.ai/security/SECURITY_DECISIONS.md`.
