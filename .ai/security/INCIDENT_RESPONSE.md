# Resposta a Incidentes de Segurança — VERTTEX NF

> **Versão:** 1.0 — 2026-07-22  
> **Referência:** LGPD, ANPD (comunicação em até 3 dias úteis para incidentes com risco relevante)

---

## Fluxo de Resposta

### 1. Detecção
- Log de auditoria anômalo
- Alerta de monitoramento
- Relato interno ou externo
- Descoberta durante desenvolvimento/review

### 2. Triagem (< 1 hora)
- Confirmar se é incidente real ou falso positivo
- Identificar o que foi afetado (dados, sistemas, usuários)
- Coletar evidências iniciais sem alteração

### 3. Classificação
| Nível | Critério |
|:---|:---|
| **Crítico** | Dados de usuários expostos, acesso não autorizado a admin, vazamento de secrets |
| **Alto** | Brecha de autorização explorada, token comprometido, acesso indevido |
| **Médio** | Tentativa detectada sem exploração confirmada |
| **Baixo** | Comportamento suspeito sem impacto confirmado |

### 4. Contenção
- Revogar sessões suspeitas (`revokeOtherSessions` ou revogação manual no DB)
- Rotar secrets comprometidos (`JWT_SECRET`, credenciais de banco, R2)
- Bloquear IP(s) identificado(s) via Cloudflare se aplicável
- Desativar conta comprometida se necessário

### 5. Preservação de Evidências
- Exportar logs de auditoria do período afetado
- Preservar estado do banco sem alterações desnecessárias
- Documentar timeline

### 6. Erradicação
- Remover acesso indevido
- Corrigir vulnerabilidade explorada
- Verificar se há outras instâncias da mesma vulnerabilidade

### 7. Recuperação
- Restaurar de backup se necessário
- Verificar integridade dos dados
- Reativar serviços afetados

### 8. Análise de Impacto
- Quais dados pessoais foram afetados?
- Quantos titulares?
- Qual a sensibilidade dos dados?

### 9. Comunicação Interna
- Notificar responsável técnico imediatamente
- Notificar liderança em incidentes de nível Alto e Crítico

### 10. Avaliação Jurídica
- Consultar responsável jurídico sobre obrigação de comunicação à ANPD
- LGPD exige comunicação em até 3 dias úteis para incidentes com risco relevante aos titulares

### 11. Comunicação à ANPD e Titulares (se aplicável)
- Seguir orientação jurídica
- Não comunicar sem avaliação do impacto

### 12. Pós-Incidente
- Análise de causa raiz (RCA)
- Criar ou atualizar teste de regressão
- Registrar decisão em `SECURITY_DECISIONS.md`
- Atualizar `SECURITY_BACKLOG.md`
- Revisar controles relacionados
- Atualizar este plano se necessário

---

## Contatos de Emergência

> ⚠️ A preencher com dados reais antes de ir para produção.

| Papel | Contato |
|:---|:---|
| Responsável técnico | — |
| Responsável jurídico | — |
| Provedor de infraestrutura | Cloudflare / Railway / etc |

---

## Comandos Úteis de Contenção

```sql
-- Revogar todas as sessões de um usuário específico
UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = '<userId>' AND revoked_at IS NULL;

-- Revogar todas as sessões ativas (emergência total)
UPDATE user_sessions SET revoked_at = NOW() WHERE revoked_at IS NULL AND expires_at > NOW();
UPDATE customer_sessions SET revoked_at = NOW() WHERE revoked_at IS NULL AND expires_at > NOW();

-- Desativar usuário suspeito
UPDATE users SET status = 'suspended' WHERE id = '<userId>';
```
