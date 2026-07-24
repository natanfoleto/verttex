# 011 — Consolidação do Núcleo Atual

## Metadata

- Status: Completed
- Priority: Critical
- Created at: 2026-07-23
- Started at: 2026-07-23
- Completed at: 2026-07-23
- Dependencies: [`completed/009-security-foundation.md`](.ai/roadmaps/completed/009-security-foundation.md), [`completed/010-security-validation-and-hardening.md`](.ai/roadmaps/completed/010-security-validation-and-hardening.md)
- Related documents: `.ai/architecture/ARCHITECTURE.md`, `.ai/domain/BUSINESS_RULES.md`, `.ai/domain/PERMISSIONS.md`, `.ai/security/AUTHENTICATION_SECURITY.md`

---

## Context

Com o encerramento da suíte de segurança e validação (Roadmaps 009 e 010), o projeto VERTTEX possui uma base sólida de infraestrutura, autenticação e autorização. No entanto, antes de avançar para os módulos de e-commerce e catálogo de produtos, faz-se necessário realizar uma consolidação formal do núcleo existente, identificando pontos de melhoria, alinhamentos finos nas permissões, tratamento de concorrência e preservação de histórico.

---

## Objectives

1. Diagnosticar detalhadamente cada subsistema do núcleo (usuários, sessões, cargos, permissões, lojas, clientes e auditoria).
2. Documentar e unificar a precedência exata do sistema de permissões e exceções individuais.
3. Formalizar o fluxo de atualização de cargos e propagação/preservação de permissões para usuários vinculados.
4. Estabelecer o isolamento por loja no backend (ownership checks e verificação de membros de loja).
5. Mapear as estratégias de exclusão (soft-delete vs. hard-delete) garantindo a integridade do histórico comercial e de auditoria.

---

## Diagnóstico do Estado Atual do Núcleo

| Subsistema                                  | Estado Real                   | Observação / Ação Recomendada                                                                                                                                                          |
| :------------------------------------------ | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Usuários Administrativos (`User`)           | **Concluído com pendências**  | CRUD completo e autenticação ativos. Pendente: refinamento visual da gestão de permissões individuais na UI do Manager.                                                                |
| Autenticação (Manager & Marketplace)        | **Concluído**                 | Fastify JWT com `jti`, `iss`, `aud`, denylist híbrida (Redis + PostgreSQL) e detecção de reuso de refresh token.                                                                       |
| Sessões (`UserSession`, `CustomerSession`)  | **Concluído**                 | Suporte a revogação individual e revogação em massa de outras sessões ativas (`DELETE /auth/users/sessions/others`).                                                                   |
| Recuperação de Acesso                       | **Parcialmente implementado** | Schemas e rotas de forgot/reset password existentes (`UserPasswordResetToken` / `CustomerPasswordResetToken`). Pendente: integração com serviço real de envio de e-mail (Resend/SMTP). |
| Verificação de E-mail                       | **Apenas estruturado**        | Coluna `emailVerifiedAt` presente nos schemas Prisma `User` e `Customer`, mas sem rotas de disparo de token de verificação.                                                            |
| Cargos (`Role`)                             | **Concluído**                 | Suporte a cargos de sistema (`admin`, `employee`, `supplier`) e cargos personalizados.                                                                                                 |
| Permissões (`Permission`, `RolePermission`) | **Concluído**                 | Mapeamento `resource.action` registrado em `@verttex/auth` e sementes em `prisma/seed.ts`.                                                                                             |
| Exceções Individuais (`UserPermission`)     | **Concluído com pendências**  | Suporte no banco a `allow` e `deny`. CASL avalia `deny` por último. Pendente: interface no Manager para marcar facilidade de override por usuário.                                     |
| Vínculos de Loja (`StoreUser`)              | **Concluído**                 | Relação N:N com colunas `isOwner` e `isActive`.                                                                                                                                        |
| Isolamento de Dados por Loja                | **Concluído com pendências**  | Validado em `authz.spec.ts`. Administrador possui acesso global (`manage.all`). Fornecedores/Funcionários restritos a lojas vinculadas.                                                |
| Clientes Compradores (`Customer`)           | **Concluído**                 | Modelo e autenticação isolados de `User`.                                                                                                                                              |
| Auditoria (`AuditLog`)                      | **Concluído**                 | Função `logAudit` com sanitização recursiva de campos sensíveis (`[PROTEGIDO]`).                                                                                                       |
| Rate Limiting                               | **Concluído**                 | Integrado ao `@fastify/rate-limit` + Redis com retorno HTTP 429.                                                                                                                       |
| Tratamento de Erros                         | **Concluído**                 | `httpErrorHandler` unificado retornando contratos `{ success: false, error: ... }` com códigos HTTP apropriados (400, 401, 403, 413, 429, 500).                                        |
| Soft-Delete vs Hard-Delete                  | **Parcialmente implementado** | `deletedAt` e `deletedBy` presentes nas tabelas `User`, `Role`, `Store`, `Customer`. Exclusão via API deve aplicar obrigatoriamente soft-delete.                                       |

---

## Validações Específicas do Núcleo

### 1. Precedência da Matriz de Permissões

Fica formalizada a seguinte ordem de precedência inegociável na engine de autorização (`@verttex/auth`):

```
1. Cargo Admin ──> can('manage', 'all') [Bypass Total]
2. Permissões de Cargo (RolePermissions) ──> can(action, subject)
3. Exceções Individuais ALLOW (UserPermission: allow) ──> can(action, subject)
4. Exceções Individuais DENY (UserPermission: deny) ──> cannot(action, subject) [Sobrescreve qualquer permissão anterior]
```

### 2. Alteração de Cargos e Propagação de Permissões

Ao alterar as permissões vinculadas a um `Role`:

- As novas permissões do cargo passam a valer **imediatamente** para todos os usuários associados a esse cargo.
- Quaisquer exceções individuais (`UserPermission`) cadastradas especificamente para um usuário são **preservadas**. Se um usuário possui um `deny` explícito para `stores.delete`, mesmo que o cargo ganhe essa permissão, o `deny` individual prevalecerá.

### 3. Escopo de Loja e Verificação de Ownership

- **Admin:** Possui bypass global e pode visualizar/editar qualquer loja.
- **Funcionário/Fornecedor:** A API **OBRIGATORIAMENTE** deve validar se existe um registro ativo em `StoreUser` ligando o `userId` à `storeId` da requisição antes de autorizar a consulta ou modificação.

### 4. Política de Exclusão (Soft-Delete)

- É **estritamente proibida** a exclusão física (`DELETE FROM`) de registros de `User`, `Role`, `Store` e `Customer`.
- A exclusão deve atualizar `deletedAt = now()` e `deletedBy = currentUserId`.
- As consultas de listagem e busca por ID do backend devem incluir por padrão o filtro `{ deletedAt: null }`.

---

## Checklist de Consolidação Pré-Próximos Módulos

- [x] Integrar serviço de envio de e-mail transacional via Resend (`EmailService` com fallback gracioso).
- [x] Garantir que todas as consultas de listagem no backend apliquem o filtro `deletedAt: null` (`roles.service.ts`, `users.service.ts`, `stores.service.ts`).
- [x] Criar testes automatizados de resiliência e sanitização em `src/email.spec.ts`.
- [x] Refinar na UI do Manager a tela de permissões individuais para visualização clara de herdado vs. sobrescrito (`/usuarios/[userId]/permissoes`).

---

## Status de Conclusão

Roadmap 011 concluído com sucesso. Todos os itens de consolidação do núcleo atual foram validados e testados. O projeto encontra-se liberado para o **Roadmap 012 (Categorias e Marcas)**.
