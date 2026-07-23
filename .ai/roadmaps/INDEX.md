# Índice Consolidado de Roadmaps — VERTTEX

> **Visão Geral dos Roadmaps do Projeto**  
> **Localização:** `.ai/roadmaps/INDEX.md`  
> **Última Atualização:** 2026-07-22

---

## Tabela Consolidada de Roadmaps

| Nº | Roadmap | Status | Prioridade | Dependências | Caminho |
|--:|:---|:---|:---|:---|:---|
| 001 | Foundation | `completed` | critical | Nenhuma | [`completed/001-foundation.md`](.ai/roadmaps/completed/001-foundation.md) |
| 002 | Data Modeling | `completed` | critical | 001 | [`completed/002-data-modeling.md`](.ai/roadmaps/completed/002-data-modeling.md) |
| 003 | User Authentication | `completed` | critical | 002 | [`completed/003-user-authentication.md`](.ai/roadmaps/completed/003-user-authentication.md) |
| 004 | Customer Authentication | `completed` | critical | 002 | [`completed/004-customer-authentication.md`](.ai/roadmaps/completed/004-customer-authentication.md) |
| 005 | Roles and Permissions | `completed` | critical | 002, 003 | [`completed/005-roles-and-permissions.md`](.ai/roadmaps/completed/005-roles-and-permissions.md) |
| 006 | Stores Management | `completed` | high | 002, 003, 005 | [`completed/006-stores-management.md`](.ai/roadmaps/completed/006-stores-management.md) |
| 007 | Manager UI | `completed` | high | 003, 005, 006 | [`completed/007-manager-ui.md`](.ai/roadmaps/completed/007-manager-ui.md) |
| 008 | Marketplace UI | `completed` | high | 004 | [`completed/008-marketplace-ui.md`](.ai/roadmaps/completed/008-marketplace-ui.md) |
| 009 | Security Foundation | `completed` | critical | 001 a 008 | [`completed/009-security-foundation.md`](.ai/roadmaps/completed/009-security-foundation.md) |
| 010 | Security Validation and Hardening | `completed` | high | 009 | [`completed/010-security-validation-and-hardening.md`](.ai/roadmaps/completed/010-security-validation-and-hardening.md) |

---

## Resumo por Status

| Status | Quantidade | Observação |
|:---|:---|:---|
| `completed` | 10 | Roadmaps 001 a 010 concluídos e validados |
| `active` | 0 | Nenhum roadmap ativo no momento |
| `planned` | 0 | Novos roadmaps serão adicionados conforme definição |
| `archived` | 0 | Nenhum roadmap arquivado |

---

## Observações
- Os roadmaps 001 a 008 representam as entregas da Fase 1 funcional da plataforma VERTTEX NF.
- O roadmap 009 registra a fundação, políticas e implementação inicial de segurança em todas as camadas do projeto.
- O roadmap 010 conduzirá os testes formais, validação adversarial, testes manuais e hardening do sistema.
