# Invariantes de Segurança de Negócio — VERTTEX

> **Versão:** 1.0 — 2026-07-22  
> **Atualizar ao:** Adicionar novo fluxo de negócio, regra de negócio crítica ou identificar novo caso de abuso

---

## Modelo de Invariante

```
Fluxo:
Ator:
Pré-condições:
Dados controlados pelo servidor:
Estados permitidos:
Transições permitidas:
Limites:
Regras de concorrência:
Eventos auditados:
Abusos considerados:
Testes obrigatórios:
```

---

## INV-001 — Criação de Usuário Gestor

| Campo | Conteúdo |
|:---|:---|
| **Fluxo** | Criar usuário gestor via `POST /users` |
| **Ator** | Usuário gestor com permissão `users.create` |
| **Pré-condições** | Ator autenticado, ativo, com permissão `users.create`; cargo informado existe no banco |
| **Dados controlados pelo servidor** | `id` (cuid), `status` (sempre `active`), `createdAt`, `updatedAt`, `passwordHash` (gerado do `password`) |
| **Estados permitidos** | `active`, `inactive`, `suspended` |
| **Transições permitidas** | `active → inactive`, `inactive → active` (via update de status) |
| **Limites** | Um único e-mail por tabela `users`; cargo deve existir |
| **Regras de concorrência** | `email @unique` previne duplicata via constraint do banco |
| **Eventos auditados** | `CREATE` com `entity: 'User'` |
| **Abusos considerados** | Mass assignment de `status: 'admin'` — não aplicável (role vem de `roleId`); criação de usuário admin por não-admin |
| **Testes obrigatórios** | Criar com e-mail duplicado → 409; Criar sem permissão → 403; Criar com cargo inexistente → 404; Status derivado sempre `active` |

---

## INV-002 — Alteração de Permissões de Usuário

| Campo | Conteúdo |
|:---|:---|
| **Fluxo** | Alterar permissões individuais via `PUT /users/:userId/permissions` |
| **Ator** | Usuário gestor com permissão `users.update` |
| **Pré-condições** | Usuário alvo existe; permissões informadas existem no banco |
| **Dados controlados pelo servidor** | Derivação de permissões efetivas (cargo + override); `updatedAt` |
| **Estados permitidos** | Efeito: `allow` ou `deny` |
| **Limites** | Permissões negadas explicitamente prevalecem sobre permissões de cargo |
| **Regras de concorrência** | `@@unique([userId, permissionId])` previne duplicata |
| **Eventos auditados** | `UPDATE_PERMISSIONS` |
| **Abusos considerados** | Dar a si mesmo permissões que não possui; alterar permissões de admin |
| **Testes obrigatórios** | Funcionário sem permissão → 403; Alterar próprias permissões → regra de negócio a definir |

---

## INV-003 — Soft Delete de Usuário

| Campo | Conteúdo |
|:---|:---|
| **Fluxo** | Arquivar usuário via `DELETE /users/:userId` |
| **Ator** | Usuário gestor com permissão `users.delete` |
| **Pré-condições** | Usuário existe; se admin, não é o último admin ativo |
| **Dados controlados pelo servidor** | `deletedAt: new Date()`, `deletedBy: actorId`, `status: 'inactive'` |
| **Limites** | Não pode arquivar o último admin ativo do sistema |
| **Eventos auditados** | `ARCHIVE` |
| **Abusos considerados** | Auto-arquivamento; arquivar o último admin (lock-out do sistema) |
| **Testes obrigatórios** | Arquivar último admin → erro específico; Usuário arquivado não pode autenticar; Restauração funciona |

---

## INV-004 — Alteração de Permissões de Cargo

| Campo | Conteúdo |
|:---|:---|
| **Fluxo** | Alterar permissões de cargo via `PUT /roles/:roleId/permissions` |
| **Ator** | Usuário gestor com permissão `roles.update` |
| **Pré-condições** | Cargo não é de sistema (`isSystem = false`) para alterações destrutivas |
| **Dados controlados pelo servidor** | Estratégia de propagação (`ALL`, `PRESERVE_ALL`, `CUSTOM`), `updatedAt` |
| **Invariante principal** | Cargos de sistema não podem ter permissões reduzidas |
| **Eventos auditados** | `UPDATE_PERMISSIONS` |
| **Abusos considerados** | Alterar cargo admin para remover permissões críticas; usar strategy `CUSTOM` com `targetUserIds` de outro tenant |
| **Testes obrigatórios** | Alterar cargo de sistema → deve ser impedido ou auditado; Propagação funciona conforme strategy |

---

## Valores que Sempre Devem Ser Calculados no Servidor

| Dado | Origem correta |
|:---|:---|
| Permissões efetivas do usuário | Banco de dados (cargo + overrides), nunca do JWT ou body |
| Status de usuário/loja | Banco de dados |
| Role do usuário | Token JWT (carregado da sessão), nunca do body |
| Tenant/loja do usuário | Sessão autenticada + banco, nunca do body |
| `deletedAt`, `deletedBy` | Servidor, nunca do cliente |
| `createdAt`, `updatedAt` | Prisma auto-managed |
| Preço, desconto, total (futuro) | Servidor, nunca do frontend |
