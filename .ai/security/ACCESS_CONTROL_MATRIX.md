# Matriz de Controle de Acesso — VERTTEX NF

> **Versão:** 1.0 — 2026-07-22  
> **Atualizar ao:** Adicionar ou remover endpoint, alterar requisito de autenticação ou permissão

---

## Legenda

| Símbolo | Significado |
|:---|:---|
| ✅ | Implementado e funcionando |
| ⚠️ | Parcialmente implementado ou a verificar |
| ❌ | Não implementado |
| 🔓 | Endpoint público |
| 🔒 | Requer autenticação |
| 👑 | Requer permissão específica |

---

## Autenticação de Usuários Gestores (`/auth/users/*`)

| Método | Endpoint | Autenticação | Permissão | Schema | Rate Limit | Auditoria |
|:---|:---|:---|:---|:---|:---|:---|
| POST | `/auth/users/login` | 🔓 Público | — | ✅ Zod | ❌ | ✅ LOGIN / LOGIN_FAILED |
| POST | `/auth/users/logout` | 🔒 User | — | — | ❌ | ✅ LOGOUT |
| POST | `/auth/users/refresh` | 🔓 Público | — | — | ❌ | ❌ |
| POST | `/auth/users/forgot-password` | 🔓 Público | — | ✅ Zod | ❌ | ⚠️ Sem logAudit explícito |
| POST | `/auth/users/reset-password` | 🔓 Público | — | ✅ Zod | ❌ | ✅ PASSWORD_RESET |
| POST | `/auth/users/change-password` | 🔒 User | — | ✅ Zod | ❌ | ✅ PASSWORD_CHANGE |
| GET | `/auth/users/me` | 🔒 User | — | — | ❌ | — |
| GET | `/auth/users/sessions` | 🔒 User | — | — | ❌ | — |
| DELETE | `/auth/users/sessions/others` | 🔒 User | — | — | ❌ | ✅ REVOKE_OTHER_SESSIONS |
| DELETE | `/auth/users/sessions/:sessionId` | 🔒 User | — | — | ❌ | ✅ REVOKE_SESSION |

---

## Autenticação de Clientes (`/auth/customers/*`)

| Método | Endpoint | Autenticação | Permissão | Schema | Rate Limit | Auditoria |
|:---|:---|:---|:---|:---|:---|:---|
| POST | `/auth/customers/register` | 🔓 Público | — | ✅ Zod | ❌ | — |
| POST | `/auth/customers/login` | 🔓 Público | — | ✅ Zod | ❌ | — |
| POST | `/auth/customers/logout` | 🔒 Customer | — | — | ❌ | — |
| POST | `/auth/customers/refresh` | 🔓 Público | — | — | ❌ | — |
| POST | `/auth/customers/forgot-password` | 🔓 Público | — | ✅ Zod | ❌ | — |
| POST | `/auth/customers/reset-password` | 🔓 Público | — | ✅ Zod | ❌ | — |
| POST | `/auth/customers/change-password` | 🔒 Customer | — | ✅ Zod | ❌ | — |

---

## Usuários (`/users/*`)

| Método | Endpoint | Autenticação | Permissão | Schema | Rate Limit | Auditoria |
|:---|:---|:---|:---|:---|:---|:---|
| GET | `/users` | 🔒 User | 👑 users.read | ✅ Zod | ❌ | — |
| POST | `/users` | 🔒 User | 👑 users.create | ✅ Zod | ❌ | ✅ CREATE |
| GET | `/users/:userId` | 🔒 User | 👑 users.read | — | ❌ | — |
| PUT | `/users/:userId` | 🔒 User | 👑 users.update | ✅ Zod | ❌ | ✅ UPDATE |
| DELETE | `/users/:userId` | 🔒 User | 👑 users.delete | — | ❌ | ✅ ARCHIVE |
| POST | `/users/:userId/restore` | 🔒 User | 👑 users.delete | — | ❌ | ✅ RESTORE |
| PUT | `/users/:userId/permissions` | 🔒 User | 👑 users.update | ✅ Zod | ❌ | ✅ UPDATE_PERMISSIONS |

---

## Cargos (`/roles/*`)

| Método | Endpoint | Autenticação | Permissão | Schema | Rate Limit | Auditoria |
|:---|:---|:---|:---|:---|:---|:---|
| GET | `/roles` | 🔒 User | 👑 roles.read | — | ❌ | — |
| POST | `/roles` | 🔒 User | 👑 roles.create | ✅ Zod | ❌ | ✅ CREATE |
| GET | `/roles/:roleId` | 🔒 User | 👑 roles.read | — | ❌ | — |
| PUT | `/roles/:roleId` | 🔒 User | 👑 roles.update | ✅ Zod | ❌ | ✅ UPDATE |
| DELETE | `/roles/:roleId` | 🔒 User | 👑 roles.delete | — | ❌ | ✅ ARCHIVE |
| GET | `/roles/:roleId/permissions` | 🔒 User | 👑 roles.read | — | ❌ | — |
| PUT | `/roles/:roleId/permissions` | 🔒 User | 👑 roles.update | ✅ Zod | ❌ | ✅ UPDATE_PERMISSIONS |

---

## Lojas (`/stores/*`)

| Método | Endpoint | Autenticação | Permissão | Schema | Rate Limit | Auditoria |
|:---|:---|:---|:---|:---|:---|:---|
| GET | `/stores` | 🔒 User | 👑 stores.read | — | ❌ | — |
| POST | `/stores` | 🔒 User | 👑 stores.create | ✅ Zod | ❌ | ✅ CREATE |
| GET | `/stores/:storeId` | 🔒 User | 👑 stores.read | — | ❌ | — |
| PUT | `/stores/:storeId` | 🔒 User | 👑 stores.update | ✅ Zod | ❌ | ✅ UPDATE |
| DELETE | `/stores/:storeId` | 🔒 User | 👑 stores.delete | — | ❌ | ✅ ARCHIVE |
| POST | `/stores/:storeId/restore` | 🔒 User | 👑 stores.delete | — | ❌ | ✅ RESTORE |
| POST | `/stores/:storeId/users` | 🔒 User | 👑 stores.update | ✅ Zod | ❌ | ✅ ADD_USER |
| DELETE | `/stores/:storeId/users/:userId` | 🔒 User | 👑 stores.update | — | ❌ | ✅ REMOVE_USER |

---

## Permissões e Auditoria

| Método | Endpoint | Autenticação | Permissão | Schema | Rate Limit | Auditoria |
|:---|:---|:---|:---|:---|:---|:---|
| GET | `/permissions` | 🔒 User | 👑 permissions.read | — | ❌ | — |
| GET | `/audit` | 🔒 User | 👑 audit.read | ✅ Zod | ❌ | — |

---

## Health Check

| Método | Endpoint | Autenticação | Schema | Rate Limit |
|:---|:---|:---|:---|:---|
| GET | `/health` | 🔓 Público | — | ❌ |

---

## Regras Obrigatórias

1. Todo endpoint que acessa objeto de outro usuário deve verificar ownership
2. Todo novo endpoint adicionado ao projeto deve ser adicionado a esta tabela
3. Endpoints administrativos devem ser identificados e monitorados
4. Ownership check é obrigatório em: leitura, listagem, criação relacionada, atualização, exclusão, download, upload
