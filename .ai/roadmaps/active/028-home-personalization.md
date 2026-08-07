# Roadmap 028 — Home Personalizada, Ofertas Reais e Recomendações Explicáveis

> **Status:** `active`  
> **Prioridade:** `high`  
> **Dependências:** Roadmaps 004, 018, 027
> **Módulo:** `apps/api` (`modules/catalog`, `modules/customer`, `modules/cart`) & `apps/marketplace`  
> **Data de Criação:** 2026-08-06  
> **Caminho:** `.ai/roadmaps/active/028-home-personalization.md`

---

## 🎯 Objetivo

Implementar a personalização determinística e transparente da página inicial (Home) do Marketplace VERTTEX, eliminando dados fabricados/falsos (descontos, parcelamento, frete grátis, avaliações fictícias e fallbacks genéricos de móveis) e oferecendo três vitrines distintas:

1. **Vistos por último:** Histórico real do usuário baseada em `PRODUCT_VIEW` válidos.
2. **Ofertas e Descontos Imperdíveis:** Apenas promoções reais onde `promotionalPrice !== null AND promotionalPrice < price`.
3. **Recomendados para Você:** Algoritmo híbrido determinístico (`home-v1`) com controle de afinidade, popularidade, frescor e diversidade.

---

## 🏗️ Requisitos Funcionais e Regras de Negócio

### 1. Ausência de Dados Fabricados
- Nenhuma seção pode inventar parcelamento, benefício de frete, avaliações ou selos promocionais não respaldados pelo banco de dados.
- Se uma seção não tiver itens elegíveis suficientes, ela deve ser omitida ou degradada explicitamente (nunca exibir produtos demonstrativos/falsos).

### 2. Oferta Real (Correção de Falso Positivo)
- Uma oferta válida **DEVE obrigatoriamente** satisfazer: `promotionalPrice !== null AND promotionalPrice < price`.
- Variações em que `promotionalPrice >= price` devem ser filtradas no servidor.

### 3. Identidade Anônima e Isolamento
- Eliminação do fallback inseguro `default-guest-session`.
- Visitantes anônimos recebem cookie `vt_visitor` assinado (first-party, HttpOnly, SameSite=Lax, Secure em produção, validade de 90 dias).
- Persistência apenas do HMAC-SHA-256 do valor do cookie (`visitorKeyHash`).
- Merge idempotente da sessão anônima pós-login via `POST /customer/merge-anonymous-session`.

### 4. Privacidade, Opt-Out e Exclusão
- Retenção de 90 dias para interações e vistos recentes.
- Endpoints de controle do cliente: `GET /customer/personalization`, `PATCH /customer/personalization` (opt-in/opt-out), `DELETE /customer/personalization/history`.
- Em caso de opt-out, a Home degrada para fallback global não personalizado.

### 5. Algoritmo de Ranking Determinístico `home-v1`
- **Recomendados com Histórico:** `0.70 * affinity + 0.20 * popularity + 0.10 * freshness`
- **Ofertas com Histórico:** `0.55 * affinity + 0.25 * discountDepth + 0.15 * popularity + 0.05 * freshness`
- **Cold Start Recomendados:** `0.60 * popularity + 0.40 * freshness`
- **Cold Start Ofertas:** `0.50 * discountDepth + 0.30 * popularity + 0.20 * freshness`
- **Diversidade:** Máximo de 2 itens da mesma loja, 2 da mesma marca e 3 da mesma categoria por seção na primeira passagem.

---

## 📋 Plano de Execução (Pushes Fechados)

### Push 0 — Roadmap e Revalidação da Baseline `[CONCLUÍDO]`
- **Escopo:** Criação deste roadmap em `active/`, atualização do índice em `.ai/roadmaps/INDEX.md`, execução e diagnóstico da baseline do Quality Gate (`pnpm verify`).
- **Status:** Concluído em 2026-08-06.

### Push 1 — Identidade Anônima e Isolamento do Carrinho `[CONCLUÍDO, CORRIGIDO E CERTIFICADO]`
- **Escopo:** Modelo `PersonalizationProfile`, cookie assinado `vt_visitor` (HMAC-SHA-256), hashing `visitorKeyHash`, exclusão de `default-guest-session`, merge transacional/idempotente `POST /customer/merge-anonymous-session` com isolamento `Serializable`, retry loop para conflitos de serialização (`P2034`/`P2002`), auditoria pós-commit, Check Constraints XOR no PostgreSQL (`personalization_profiles_xor_identity_check` e `carts_xor_owner_check`), índices parciais de carrinho ativo, proteção estrita do `db:clean` (allowlist exata) e testes de integração HTTP reais por `app.inject()`.
- **Status:** Concluído, recertificado e auditado na Rodada I na branch `fix/roadmap-028-push1-final` a partir do SHA `04acd6f834739ab7cf85e8a8e1de0eb88000f7d6`. Referência de Evidências: `PUSH_1I_EVIDENCE.md`.

### Push 2 — Fronteira Canônica do Catálogo e Oferta Real `[NÃO AVALIADO — AGUARDANDO AUTORIZAÇÃO]`
- **Status:** Implementado antecipadamente na branch `main` (commit `b0ac3d1`). Não auditado, não avaliado e não certificado nesta branch corretiva. Aguarda autorização formal após conclusão do Push 1.

### Push 3 — Eventos, Histórico, Merge e Privacidade
- **Escopo:** Modelos `ProductInteraction` e `RecentlyViewedProduct`, rotas de registro de eventos públicos/servidor, opt-out e purge de histórico, `PersonalizationRetentionService`.

### Push 4 — Ranking e API Unificada da Home
- **Escopo:** Motor `home-v1`, geradores de candidatos, endpoint `GET /public/home/sections`, headers de cache privado (`private, no-store, Vary: Cookie`), Zod schemas.

### Push 5 — Integração Visual e Tracking no Marketplace
- **Escopo:** Integração de `apps/marketplace/src/app/page.tsx` com `GET /public/home/sections`, remoção de dados estáticos/falsos, tracking assíncrono de impressoes/cliques.

### Push 6 — Hardening, Observabilidade e Performance
- **Escopo:** Rate limits, otimização contra N+1, logs estruturados sem PII, job de limpeza de retenção, benchmark de desempenho.

### Push 7 — Recertificação Final
- **Escopo:** Suíte completa de testes unitários/integração com PostgreSQL e Redis reais, verificação de migrations em banco limpo, Quality Gate `pnpm verify` 100% verde.

---

## 🔒 Quality Gate & Verificação Canônica
Toda etapa deve ser validada executando:
```bash
pnpm verify
```
Garantindo que `lint`, `typecheck`, `test` e `build` passem sem alterações residuais no working tree (`git diff --exit-code`).
