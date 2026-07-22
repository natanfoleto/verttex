# Modelo de Ameaças — VERTTEX NF

> **Metodologia:** STRIDE por fluxo crítico  
> **Versão:** 1.0 — Estado atual em 2026-07-22  
> **Atualizar ao:** Adicionar novo fluxo crítico, novo ator, nova integração ou modificar autenticação/autorização

---

## 1. Atores do Sistema

| Ator | Descrição | Nível de Confiança |
|:---|:---|:---|
| **Admin** | Usuário gestor com cargo `admin` | Alto (após autenticação multifator planejado) |
| **Employee** | Usuário gestor com cargo `employee` | Médio (após autenticação) |
| **Supplier** | Usuário gestor com cargo `supplier` | Médio-Baixo (após autenticação) |
| **Customer** | Cliente do marketplace autenticado | Baixo (após autenticação) |
| **Anônimo** | Requisição sem autenticação | Zero |
| **Sistema** | Ações automatizadas internas | Confiável com auditoria |
| **IA colaboradora** | Agente de desenvolvimento | Zero — resultados sempre revisados |

---

## 2. Ativos a Proteger

| Ativo | Criticidade | Classificação |
|:---|:---|:---|
| Senhas de usuários e clientes | Crítico | Dado pessoal sensível |
| Refresh tokens | Crítico | Material de autenticação |
| Access tokens JWT | Alto | Material de autenticação |
| Tokens de reset de senha | Alto | Material de autenticação |
| Dados pessoais (nome, email, telefone) | Alto | Dado pessoal — LGPD |
| Configurações de permissões e cargos | Alto | Dado de controle de acesso |
| Logs de auditoria | Alto | Evidência de ações |
| Credenciais de infraestrutura (DB, R2, JWT_SECRET) | Crítico | Secret |
| Dados de lojas e fornecedores | Médio | Dado comercial |
| Código-fonte | Alto | Propriedade intelectual |

---

## 3. Fluxo 1 — Login de Usuário Gestor

### Diagrama de fluxo

```
Anônimo → POST /auth/users/login → API → PostgreSQL
                                       ↓
                                   UserSession criada
                                       ↓
                             JWT (15 min) + RefreshToken (7d)
                                       ↓
                              Cookies HttpOnly → Navegador
```

### STRIDE

| Ameaça | Categoria | Controle Atual | Gap |
|:---|:---|:---|:---|
| Brute force de senha | **T**ampering | Mensagem genérica | ❌ Sem rate limit (VULN-002) |
| Credential stuffing | **T**ampering | Mensagem genérica | ❌ Sem rate limit (VULN-002) |
| Enumeração de usuários por timing | **I**nformation Disclosure | `timingSafeEqual` | ⚠️ Mas sem hash dummy para usuário inexistente |
| Roubo de cookie de sessão | **E**levation | HttpOnly, Secure, SameSite | ⚠️ Sem `Strict` (Lax) |
| Falsificação de token | **S**poofing | Assinatura JWT com secret | ❌ Sem validação de `iss`/`aud` (VULN-004) |
| Replay de access token após logout | **E**levation | Sessão revogada no DB | ❌ Token ainda válido por 15 min sem `jti` denylist (VULN-004) |
| Token comprometido em `localStorage` | **I**nformation Disclosure | Cookies HttpOnly | ✅ Não exposto ao JS |
| Falsificação de IP para bypass de rate limit | **T**ampering | — | ❌ `trustProxy` não configurado (VULN-005) |

---

## 4. Fluxo 2 — Recuperação de Senha

### Diagrama de fluxo

```
Anônimo → POST /auth/users/forgot-password → API
                                              ↓
                                 Resposta genérica sempre
                                              ↓
                              (se user existe) Token gerado
                                              ↓
                                    Hash armazenado no DB
                                              ↓ (simulado — sem email real)
                                    console.log token (DEV ONLY)
                                              ↓
Anônimo → POST /auth/users/reset-password { token, newPassword }
                                              ↓
                              Token validado (hash, expirado, usado)
                                              ↓
                              Senha atualizada + Sessões revogadas
```

### STRIDE

| Ameaça | Categoria | Controle Atual | Gap |
|:---|:---|:---|:---|
| Enumeração de contas via forgot-password | **I**nformation Disclosure | Resposta genérica sempre | ✅ |
| Brute force do token de recuperação | **T**ampering | Token de 64 bytes hex (256 bits de entropia) | ❌ Sem rate limit na validação do token (VULN-002) |
| Token de recuperação exposto em log | **I**nformation Disclosure | `console.log` intencional para DEV | ⚠️ Deve ser removido antes da produção |
| Replay de token após uso | **T**ampering | `usedAt` marcado na transação | ✅ |
| Token sem expiração | **E**levation | `expiresAt: +1h` | ✅ |
| Sessões antigas não revogadas | **E**levation | `userSession.updateMany({ revokedAt })` | ✅ |
| Flood de e-mails de recuperação | **D**enial of Service | — | ❌ Sem rate limit (VULN-002) |

---

## 5. Fluxo 3 — Autorização de Recurso

### STRIDE

| Ameaça | Categoria | Controle Atual | Gap |
|:---|:---|:---|:---|
| IDOR — acesso a objeto de outro usuário | **E**levation | Ownership check em principais endpoints | ⚠️ Cobertura parcial — revisar todos endpoints |
| BFLA — chamar endpoint de admin sem permissão | **E**levation | `requirePermission` + CASL | ✅ |
| Mass assignment de `role` via body | **E**levation | `role` derivado do token, não do body | ✅ |
| Cross-tenant: usuário de loja A acessando loja B | **E**levation | `requireStoreAccess` | ⚠️ Cobertura a verificar |
| Bypass via alteração de ID na URL | **E**levation | Ownership check | ⚠️ Parcial |
| Escalada por manipulação de permissões | **E**levation | Auditoria de permissões | ✅ Auditado |

---

## 6. Fluxo 4 — Refresh de Token

### STRIDE

| Ameaça | Categoria | Controle Atual | Gap |
|:---|:---|:---|:---|
| Roubo e uso de refresh token | **S**poofing | Token opaco de alta entropia, armazenado como hash | ⚠️ Sem detecção de reutilização de token revogado (VULN-006) |
| Replay de refresh token antigo | **T**ampering | Token revogado na rotação | ❌ Sem detecção de reutilização — Fase 5 |
| Exfiltração de refresh token do cookie | **I**nformation Disclosure | HttpOnly cookie | ✅ |
| Refresh token retornado na resposta JSON | **I**nformation Disclosure | Token exposto no body além do cookie | ⚠️ Considerar remover do body |

---

## 7. Fluxo 5 — Upload de Arquivos (Futuro)

### STRIDE (pré-implementação)

| Ameaça | Categoria | Controle Atual | Gap |
|:---|:---|:---|:---|
| Upload de arquivo malicioso | **T**ampering | — | ❌ Sem pipeline (VULN — Fase 20) |
| MIME type spoofing | **S**poofing | — | ❌ Sem validação de magic bytes |
| Path traversal no nome do arquivo | **E**levation | — | ❌ Sem sanitização |
| Decompression bomb | **D**enial of Service | — | ❌ Sem proteção |
| Acesso público a arquivo de quarentena | **I**nformation Disclosure | — | ❌ Sem controle de acesso ao bucket |
| Upload sem autorização | **E**levation | — | ❌ Sem verificação |
| Imagem com payload (steganografia) | **T**ampering | — | ❌ Sem re-encode obrigatório |

---

## 8. Vetores de Ataque Externos Prioritários

| Vetor | Probabilidade | Impacto | Controle Atual |
|:---|:---|:---|:---|
| Brute force de login | Alta | Alto | ❌ Sem rate limit |
| SQL Injection | Baixa | Crítico | ✅ Prisma ORM sem raw SQL |
| XSS armazenado | Média | Alto | ⚠️ Sem CSP |
| CSRF | Baixa (SameSite Lax) | Médio | ⚠️ SameSite Lax, sem token CSRF |
| IDOR / BOLA | Média | Alto | ⚠️ Parcialmente mitigado |
| Credential stuffing | Alta | Alto | ❌ Sem rate limit |
| Roubo de JWT | Baixa | Alto | ✅ HttpOnly cookie |
| Secrets no repositório | Baixa | Crítico | ✅ .gitignore, sem CI |
| Dependência vulnerável | Média | Variável | ❌ Sem scanning automatizado |
