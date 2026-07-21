# Regras de Auditoria — Verttex

## ⚠️ Regra Permanente — Padrão Arquitetural

> **TODA nova implementação deve ser analisada sob a perspectiva de auditoria.**
>
> Toda ação executada por um usuário e toda ação automática executada pelo sistema que **crie, altere, remova, publique, arquive, restaure, aprove, rejeite, autentique, importe, exporte ou modifique o estado de qualquer recurso** deve gerar um registro de auditoria.
>
> **Nenhuma funcionalidade futura que altere o estado do sistema poderá ser considerada concluída sem a implementação da respectiva auditoria.**

Esta regra se aplica a:
- Novos módulos e endpoints
- Novas mutations e serviços
- Novos jobs e automações
- Novos webhooks e integrações
- Novos fluxos de autenticação
- Novas configurações
- Novas ações em massa
- Novos comandos administrativos

---

## 1. Objetivo do Módulo

O módulo de auditoria registra todas as ações relevantes do sistema, permitindo responder às perguntas:

- **Quem** realizou a ação?
- **Qual** ação foi realizada?
- **Em qual entidade** (User, Store, Role, etc.)?
- **Qual registro** foi afetado (entityId)?
- **Quando** ocorreu?
- **Qual era o estado anterior** (oldValues)?
- **Qual passou a ser o novo estado** (newValues)?
- **De qual IP** originou a requisição?
- **Qual navegador** ou agente realizou a ação?
- **Foi um usuário ou o próprio sistema** quem realizou?

---

## 2. Taxonomia de Ações (Padronizada)

Use **exatamente** estas strings. Não criar variantes como `EDIT`, `UPDATED`, `CHANGE`.

| Ação | Descrição |
|---|---|
| `CREATE` | Criação de um novo recurso |
| `UPDATE` | Atualização de campos de um recurso |
| `DELETE` | Exclusão ou desativação de um recurso |
| `STATUS_CHANGE` | Alteração de status (ex: active → inactive) |
| `LOGIN` | Login bem-sucedido |
| `LOGOUT` | Encerramento de sessão |
| `LOGIN_FAILED` | Tentativa de login inválida |
| `PASSWORD_RESET` | Redefinição de senha via token |
| `PASSWORD_CHANGE` | Alteração de senha pelo próprio usuário |
| `PERMISSION_CHANGE` | Alteração de permissões de usuário ou cargo |
| `ACTIVATE` | Ativação explícita de um recurso |
| `DEACTIVATE` | Desativação explícita de um recurso |
| `ARCHIVE` | Arquivamento de um recurso |
| `RESTORE` | Restauração de um recurso arquivado |
| `APPROVE` | Aprovação de um recurso |
| `REJECT` | Rejeição de um recurso |
| `PUBLISH` | Publicação de um recurso |
| `UNPUBLISH` | Despublicação de um recurso |
| `IMPORT` | Importação de dados |
| `EXPORT` | Exportação de dados |
| `MEMBER_ADD` | Adição de membro a um grupo/loja |
| `MEMBER_REMOVE` | Remoção de membro de um grupo/loja |
| `SYSTEM_ACTION` | Ação automática do sistema sem usuário |

---

## 3. Padronização das Entidades

A propriedade `entity` deve usar nomes técnicos consistentes (PascalCase, singular):

| Técnico | Label PT-BR |
|---|---|
| `User` | Usuário |
| `Store` | Loja |
| `Role` | Cargo |
| `Permission` | Permissão |
| `Product` | Produto |
| `Order` | Pedido |
| `Category` | Categoria |
| `Customer` | Cliente |
| `SystemSettings` | Config. Sistema |
| `MarketplaceSettings` | Config. Marketplace |

**Não usar**: `store`, `stores`, `StoreEntity`, `LOJA`, `Loja` para representar o mesmo recurso.

---

## 4. Como Registrar Auditoria

### Helper centralizado

Localização: `apps/api/src/shared/utils/audit.ts`

```typescript
import { logAudit } from '../../shared/utils/audit'

await logAudit({
  userId: userPayload.id,   // null para ações do sistema
  action: 'CREATE',
  entity: 'Store',
  entityId: store.id,
  oldValues: previousStore, // omitir em criações
  newValues: store,
  req,                      // FastifyRequest — para captura de IP/UA
})
```

### Criação

```typescript
const store = await prisma.store.create({ data })

await logAudit({
  userId: userPayload.id,
  action: 'CREATE',
  entity: 'Store',
  entityId: store.id,
  newValues: store,
  req,
})
```

### Atualização (sempre capturar estado anterior)

```typescript
const previousStore = await prisma.store.findUnique({ where: { id } })
const updatedStore = await prisma.store.update({ where: { id }, data })

await logAudit({
  userId: userPayload.id,
  action: 'UPDATE',
  entity: 'Store',
  entityId: id,
  oldValues: previousStore,
  newValues: updatedStore,
  req,
})
```

### Exclusão

```typescript
const existingStore = await prisma.store.findUnique({ where: { id } })
await prisma.store.delete({ where: { id } })

await logAudit({
  userId: userPayload.id,
  action: 'DELETE',
  entity: 'Store',
  entityId: id,
  oldValues: existingStore,
  req,
})
```

### Ações do sistema (sem usuário)

```typescript
await logAudit({
  userId: null,
  action: 'SYSTEM_ACTION',
  entity: 'Store',
  entityId: store.id,
  newValues: { source: 'cron-job', job: 'sync-store-status' },
})
```

---

## 5. Captura de IP

O helper `logAudit` captura o IP automaticamente a partir do `FastifyRequest`:

1. `x-forwarded-for` (primeiro IP, para ambientes com proxy/CDN)
2. `x-real-ip`
3. `cf-connecting-ip` (Cloudflare)
4. `request.ip` (fallback)

Sempre passar `req` quando disponível. Para ações do sistema (jobs, crons), omitir `req` — o IP ficará `null`.

---

## 6. Dados Sensíveis

O helper sanitiza automaticamente os seguintes campos antes de persistir:

```
password, passwordHash, currentPassword, newPassword, confirmPassword,
token, accessToken, refreshToken, refreshTokenHash, tokenHash,
secret, apiKey, authorization, cookie, session
```

Esses campos são substituídos por `"[PROTEGIDO]"` recursivamente no objeto.

O visualizador de diff na interface também aplica mascaramento adicional.

---

## 7. Estratégia de Transações

- **Fora da transação principal**: `logAudit` é chamado após a operação principal ser concluída com sucesso. Isso evita bloquear a operação principal por falha de auditoria.
- **Never throws**: `logAudit` captura internamente todas as exceções e registra no console sem re-lançar.
- **Risco**: Se a operação principal for concluída mas `logAudit` falhar, o log não será registrado. Monitorar os logs de console em produção para identificar falhas.

Para operações críticas de segurança (login, alteração de permissões), considerar usar `prisma.auditLog.create()` diretamente dentro da transação principal.

---

## 8. RBAC — Acesso ao Painel

O endpoint `GET /audit` requer: `requirePermission('read', 'AuditLog')`

- **admin**: acesso automático (manage all)
- **employee / supplier**: sem acesso por padrão
- Permissão explícita: `audit.read` → mapeia para `read` em `AuditLog`

A página `/auditoria` no Manager só é exibida para usuários com `ability.can('read', 'AuditLog')`.

---

## 9. Checklist Obrigatório para Novas Funcionalidades

Antes de concluir qualquer funcionalidade que altere estado:

- [ ] Existe alguma ação do usuário que altera estado?
- [ ] Existe alguma ação automática que altera estado?
- [ ] A criação está auditada com `action: 'CREATE'` e `newValues`?
- [ ] A atualização captura estado anterior (`oldValues`) e novo (`newValues`)?
- [ ] A exclusão registra os dados anteriores (`oldValues`)?
- [ ] As alterações de status usam `action: 'STATUS_CHANGE'`?
- [ ] O usuário responsável está identificado (`userId`)?
- [ ] Ações do sistema usam `userId: null`?
- [ ] IP e User-Agent são capturados via `req`?
- [ ] Dados sensíveis não estão sendo persistidos manualmente?
- [ ] A entidade e a ação seguem os padrões documentados neste arquivo?
- [ ] A matriz de cobertura foi atualizada?

---

## 10. Matriz de Cobertura

| Módulo | Ação | Endpoint/Serviço | Auditada |
|---|---|---|---|
| Auth Users | LOGIN | `auth-users.service.ts#login` | ✅ |
| Auth Users | LOGOUT | `auth-users.service.ts#logout` | ✅ |
| Auth Users | LOGIN_FAILED | `auth-users.controller.ts#loginController` | ✅ |
| Auth Users | PASSWORD_RESET | `auth-users.service.ts#resetPassword` | ✅ |
| Auth Users | PASSWORD_CHANGE | `auth-users.service.ts#changePassword` | ✅ |
| Users | CREATE | `users.service.ts#createUser` | ✅ |
| Users | UPDATE / STATUS_CHANGE | `users.service.ts#updateUser` | ✅ |
| Users | DELETE | `users.service.ts#deleteUser` | ✅ |
| Users | PERMISSION_CHANGE | `users.service.ts#updateUserPermissions` | ✅ |
| Stores | CREATE | `stores.service.ts#createStore` | ✅ |
| Stores | UPDATE / STATUS_CHANGE | `stores.service.ts#updateStore` | ✅ |
| Stores | DELETE | `stores.service.ts#deleteStore` | ✅ |
| Stores | MEMBER_ADD | `stores.service.ts#addStoreMember` | ✅ |
| Stores | MEMBER_REMOVE | `stores.service.ts#removeStoreMember` | ✅ |
| Roles | CREATE | `roles.service.ts#createRole` | ✅ |
| Roles | UPDATE | `roles.service.ts#updateRole` | ✅ |
| Roles | DELETE | `roles.service.ts#deleteRole` | ✅ |
| Roles | PERMISSION_CHANGE | `roles.service.ts#updateRolePermissions` | ✅ |

---

## 11. Exemplos de Implementação para Novos Módulos

Ao criar um novo módulo `Product`:

```typescript
// CREATE
const product = await prisma.product.create({ data })
await logAudit({ userId: userPayload.id, action: 'CREATE', entity: 'Product', entityId: product.id, newValues: product, req })

// UPDATE
const prev = await prisma.product.findUnique({ where: { id } })
const updated = await prisma.product.update({ where: { id }, data })
await logAudit({ userId: userPayload.id, action: 'UPDATE', entity: 'Product', entityId: id, oldValues: prev, newValues: updated, req })

// DELETE
const existing = await prisma.product.findUnique({ where: { id } })
await prisma.product.delete({ where: { id } })
await logAudit({ userId: userPayload.id, action: 'DELETE', entity: 'Product', entityId: id, oldValues: existing, req })
```

Adicionar o label em `apps/manager/src/app/(dashboard)/auditoria/page.tsx`:

```typescript
const entityLabels: Record<string, string> = {
  // ...
  Product: 'Produto',
}
```
