# Gerenciamento de Secrets — VERTTEX

> **Versão:** 1.0 — 2026-07-22  
> **NUNCA registrar o valor de um secret aqui. Apenas nome, finalidade, responsável e política de rotação.**

---

## 1. Secrets Existentes

| Nome da Variável | Finalidade | Onde Usado | Responsável | Rotação |
|:---|:---|:---|:---|:---|
| `DATABASE_URL` | Conexão com PostgreSQL | API | Infraestrutura | A definir — antes de qualquer vazamento suspeito |
| `JWT_SECRET` | Assinatura de tokens JWT | API | Segurança | A definir — rotação requer invalidação de todos os tokens ativos |
| `COOKIE_SECRET` | Assinatura de cookies | API | Segurança | A definir |
| `CORS_ORIGIN` | Allowlist de CORS | API | Infraestrutura | A cada novo domínio adicionado |
| `R2_ENDPOINT` | Endpoint do Cloudflare R2 | API | Infraestrutura | — |
| `R2_ACCESS_KEY_ID` | Credencial de acesso ao R2 | API | Infraestrutura | A definir — mínimo anual |
| `R2_SECRET_ACCESS_KEY` | Chave secreta R2 | API | Infraestrutura | A definir — junto com R2_ACCESS_KEY_ID |
| `R2_BUCKET_NAME` | Nome do bucket R2 | API | Infraestrutura | — |

---

## 2. Regras Absolutas

- Nunca colocar valor de secret no código-fonte
- Nunca commitar `.env` real ou qualquer arquivo com valor de secret
- `.env.example` contém apenas nomes de variáveis e exemplos não secretos
- Nunca logar secrets — nem em desenvolvimento
- Nunca incluir secrets em mensagens de erro
- Nunca incluir secrets em prompts enviados a IAs externas
- Em caso de vazamento confirmado: considerar o secret comprometido e rotacionar imediatamente (remover do Git não é suficiente)

---

## 3. Estado Atual

| Controle | Status | Observação |
|:---|:---|:---|
| `.env.*` no `.gitignore` | ✅ | `!.env.example` rastreado |
| Variáveis tipadas com Zod | ✅ | `@t3-oss/env-core` |
| `.env.example` existente | ❌ | Não há `.env.example` nos apps — criar |
| Secret manager | ❌ | Apenas arquivos `.env` locais |
| Secret scanning automatizado | ❌ | Fase 9 |
| Pre-commit hook de scanning | ❌ | Fase 9 |
| Rotação documentada | ❌ | Processo não definido |
| Secrets diferentes por ambiente | ❓ | Não verificado |

---

## 4. Planejado

- Fase 9: Implementar `gitleaks` ou similar no CI para secret scanning
- Produção: Migrar para secret manager (Railway secrets, Doppler, ou equivalente)
- Criar `.env.example` em cada app com nomes e exemplos fictícios

---

## 5. Procedimento de Rotação de `JWT_SECRET`

> **Impacto:** Rotacionar `JWT_SECRET` invalida **todos** os access tokens e refresh tokens ativos.

1. Comunicar manutenção se necessário
2. Gerar novo secret de alta entropia (`openssl rand -hex 64`)
3. Atualizar na infraestrutura (não no código)
4. Reiniciar a API
5. Todos os usuários serão desconectados no próximo request (token inválido)
6. Registrar data e motivo da rotação
