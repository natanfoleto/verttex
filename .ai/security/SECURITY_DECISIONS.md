# Registro de Decisões de Segurança — VERTTEX

> Todo desvio da política, toda escolha técnica importante e toda exceção aceita devem ser registradas aqui.  
> **Formato:** Uma seção por decisão, com ID sequencial.  
> **Nunca registrar valores de secrets aqui.**

---

## Modelo de Registro

```
## SD-XXX — Título da Decisão

| Campo | Conteúdo |
|:---|:---|
| **Data** | AAAA-MM-DD |
| **Status** | Ativa / Substituída por SD-YYY / Revisão pendente |
| **Responsável** | Nome ou papel |
| **Área** | Autenticação / Autorização / Criptografia / Sessão / Upload / CI/CD / etc |
| **Contexto** | Por que essa decisão foi necessária |
| **Decisão** | O que foi decidido |
| **Consequências** | Impactos positivos e negativos |
| **Risco aceito** | Qual risco residual existe |
| **Prazo de revisão** | Data ou condição que deve disparar revisão |
| **Referência** | ASVS, OWASP Cheat Sheet, RFC, etc |
```

---

## SD-001 — Algoritmo de Hash de Senhas: scrypt via node:crypto

| Campo                | Conteúdo                                                                                                                                                                                                                     |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data**             | 2026-07-22                                                                                                                                                                                                                   |
| **Status**           | Ativa                                                                                                                                                                                                                        |
| **Responsável**      | Equipe técnica                                                                                                                                                                                                               |
| **Área**             | Criptografia                                                                                                                                                                                                                 |
| **Contexto**         | OWASP recomenda Argon2id como primeira opção para hash de senhas. O Node.js 24.7.0 introduziu suporte nativo a Argon2 via `node:crypto`, mas a versão atual do projeto é Node.js 22.12.0, onde essa API não está disponível. |
| **Decisão**          | Manter `scrypt` via `node:crypto` com salt de 16 bytes e saída de 64 bytes. Não instalar dependência externa (`argon2`, `bcrypt`) no momento.                                                                                |
| **Consequências**    | `scrypt` é seguro e aprovado pelo OWASP como segunda opção. Sem dependências nativas adicionais para compilar. Formato `salt:hash` em hex.                                                                                   |
| **Risco aceito**     | Baixo. `scrypt` é memory-hard e resistente a GPU/ASIC. Não é Argon2id mas está dentro das recomendações OWASP.                                                                                                               |
| **Prazo de revisão** | Quando o projeto migrar para Node.js 24.x LTS com API Argon2 estável. Avaliar migração para Argon2id com rota de migração transparente (hash na próxima autenticação bem-sucedida).                                          |
| **Referência**       | [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)                                                                                                       |

---

## SD-002 — E-mail Compartilhado entre Usuário Gestor e Cliente

| Campo                | Conteúdo                                                                                                                                                                                                       |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data**             | 2026-07-22                                                                                                                                                                                                     |
| **Status**           | Ativa                                                                                                                                                                                                          |
| **Responsável**      | Produto                                                                                                                                                                                                        |
| **Área**             | Autorização / Identidade                                                                                                                                                                                       |
| **Contexto**         | `User` (gestores) e `Customer` (clientes) são entidades em tabelas separadas com fluxos de autenticação independentes e JWTs com `actorType` diferente (`user` vs `customer`).                                 |
| **Decisão**          | Permitir que o mesmo e-mail seja utilizado para uma conta de gestor (`User`) e uma conta de cliente (`Customer`) simultaneamente. A validação de unicidade ocorre dentro de cada tabela de forma independente. |
| **Consequências**    | Um funcionário pode usar o mesmo e-mail para acessar o Manager como gestor e o Marketplace como cliente. O `actorType` no JWT garante separação de contexto.                                                   |
| **Risco aceito**     | Baixo. Contextos completamente separados no backend. Tokens incompatíveis entre contextos (validação de `actorType`).                                                                                          |
| **Prazo de revisão** | Quando for implementado login social ou SSO — avaliar impacto no fluxo unificado de identidade.                                                                                                                |
| **Referência**       | Decisão 10 do roadmap de modelagem de dados                                                                                                                                                                    |

---

## SD-003 — Denylist de jti em PostgreSQL (sem Redis)

| Campo                | Conteúdo                                                                                                                                                                                                                                                                                    |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Data**             | 2026-07-22                                                                                                                                                                                                                                                                                  |
| **Status**           | Planejada — a implementar na Fase 4                                                                                                                                                                                                                                                         |
| **Responsável**      | Equipe técnica                                                                                                                                                                                                                                                                              |
| **Área**             | Sessão / JWT                                                                                                                                                                                                                                                                                |
| **Contexto**         | O access token JWT tem duração de 15 minutos. Após logout, a sessão é revogada no banco, mas o access token permanece válido até expirar. Para revogação imediata, é necessária uma denylist de `jti`. Redis seria ideal por TTL automático, mas não está disponível no projeto atualmente. |
| **Decisão**          | Implementar denylist de `jti` usando tabela PostgreSQL com limpeza periódica. Entradas são deletadas após o timestamp de expiração do token.                                                                                                                                                |
| **Consequências**    | Cada requisição autenticada fará uma consulta adicional à tabela de tokens revogados. Com índice em `jti` e limpeza de registros expirados, o impacto é mínimo.                                                                                                                             |
| **Risco aceito**     | Médio até implementação. Após Fase 4: baixo. A janela de risco atual é máxima de 15 minutos após logout (duração do access token).                                                                                                                                                          |
| **Prazo de revisão** | Quando Redis for introduzido na infraestrutura — migrar denylist para Redis com TTL automático.                                                                                                                                                                                             |
| **Referência**       | ASVS 3.2.1, [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)                                                                                                                                                       |

---

## SD-004 — Rate Limit em Memória para Desenvolvimento

| Campo                | Conteúdo                                                                                                                                                                                                                                           |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data**             | 2026-07-22                                                                                                                                                                                                                                         |
| **Status**           | Planejada — a implementar na Fase 3                                                                                                                                                                                                                |
| **Responsável**      | Equipe técnica                                                                                                                                                                                                                                     |
| **Área**             | Rate Limiting                                                                                                                                                                                                                                      |
| **Contexto**         | Rate limiting efetivo entre múltiplas instâncias requer Redis. O projeto não possui Redis disponível no momento.                                                                                                                                   |
| **Decisão**          | Implementar rate limiting com `@fastify/rate-limit` usando armazenamento em memória para desenvolvimento local. Em produção com múltiplas instâncias, será necessário Redis. O código deve aceitar configuração de Redis via variável de ambiente. |
| **Consequências**    | Em instância única (dev/produção inicial), o rate limit funciona corretamente. Em múltiplas instâncias sem Redis, cada instância tem seus próprios contadores — atacante poderia contornar distribuindo requisições entre instâncias.              |
| **Risco aceito**     | Médio em ambiente multi-instância sem Redis. Aceitável na fase inicial do projeto com instância única.                                                                                                                                             |
| **Prazo de revisão** | Antes de escalar para múltiplas instâncias.                                                                                                                                                                                                        |
| **Referência**       | [OWASP API Security Top 10 - API4: Unrestricted Resource Consumption](https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/)                                                                                     |

---

## SD-005 — Gates de Segurança Pré-Deploy em vez de CI/CD Fixo (.github/workflows)

| Campo                | Conteúdo                                                                                                                                                                                                                                                                                     |
| :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data**             | 2026-07-22                                                                                                                                                                                                                                                                                   |
| **Status**           | Ativa                                                                                                                                                                                                                                                                                        |
| **Responsável**      | Infraestrutura e Segurança                                                                                                                                                                                                                                                                   |
| **Área**             | CI/CD / Verificação de Código                                                                                                                                                                                                                                                                |
| **Contexto**         | O repositório não utilizará obrigatoriamente a estrutura `.github/workflows` por flexibilidade de escolha da plataforma de deploy (ex: Railway, Vercel, GitLab CI, scripts de deploy customizados).                                                                                          |
| **Decisão**          | Remover o arquivo `.github/workflows/ci.yml` do repositório. As verificações de segurança e qualidade (Typecheck, Vitest, Anti-Raw SQL e Secret Scan) passam a ser **gates pré-deploy obrigatórios** a serem executados pela plataforma de deploy ou script de build antes de cada promoção. |
| **Consequências**    | Nenhuma dependência rígida com o GitHub Actions no código-fonte. O checklist de verificação de segurança é mantido e deve ser invocado antes do build/deploy.                                                                                                                                |
| **Risco aceito**     | Baixo, desde que os comandos `pnpm typecheck`, `pnpm --filter @verttex/api test` e verificações pré-deploy sejam executados no pipeline final.                                                                                                                                               |
| **Prazo de revisão** | Na definição da plataforma final de CI/CD e deploy.                                                                                                                                                                                                                                          |
| **Referência**       | NIST SSDF                                                                                                                                                                                                                                                                                    |
