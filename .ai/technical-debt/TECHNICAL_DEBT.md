# Catálogo Oficial de Débitos Técnicos — VERTTEX

> **Localização:** `.ai/technical-debt/TECHNICAL_DEBT.md`  
> **Status:** Documento Oficial de Acompanhamento Técnico  
> **Última Atualização:** 2026-08-03

Este documento funciona como a fonte única da verdade para o backlog de **Débitos Técnicos** do ecossistema VERTTEX. Todos os problemas estruturais, divergências de código, violações de regras arquiteturais e vulnerabilidades resolvidas ou pendentes devem ser catalogados e acompanhados aqui.

---

## Tabela Consolidada de Débitos Técnicos

| ID           | Título                                             | Categoria                 | Área        | Prioridade | Severidade | Status                                         |
| :----------- | :------------------------------------------------- | :------------------------ | :---------- | :--------- | :--------- | :--------------------------------------------- |
| **DEBT-001** | Uso de Tags `<img>` Nativas em vez de `next/image` | Frontend / Infraestrutura | Marketplace | `LOW`      | `LOW`      | `ACCEPTED` (Mantido por custo/recursos Vercel) |

---

### DEBT-001 — Uso de Tags de Imagem Nativas (`<img>`) em Vez do `next/image`

- **ID:** `DEBT-001`
- **Título:** Uso de Tags `<img>` Nativas em Vez do Componente `<Image />` do Next.js
- **Categoria:** Frontend / Infraestrutura & Custos
- **Descrição:** Diversos componentes de catálogo e perfil no marketplace (ex: `store-card.tsx`, `category-card.tsx`, `product-detail.tsx`, `marketplace-carousel.tsx`) utilizam a tag nativa `<img>` em vez do componente `<Image />` do Next.js.
- **Motivo / Decisão:** O uso de `<img>` nativo é **mantido intencionalmente por decisão de infraestrutura**, pois a otimização automática de imagens do Next.js consome cotas/recursos significativos na hospedagem da Vercel.
- **Impacto Atual:** Alertas informativos nos logs de compilação/linter (`@next/next/no-img-element`), porém reduz o consumo de cotas de Image Optimization na Vercel.
- **Risco Futuro:** Métrica de LCP sem compressão automática Next.js em conexões muito lentas.
- **Área Afetada:** `apps/marketplace/src/components/`
- **Prioridade:** `LOW`
- **Severidade:** `LOW`
- **Esforço Estimado:** S (Decisão de Arquitetura/Infra)
- **Dependências:** Análise cautelosa futura de custos de infraestrutura Vercel vs Cloudflare R2 image transformation.
- **Recomendação:** Manter a implementação atual com `<img>` nativo. Caso surja a necessidade de migração no futuro, realizar benchmark prévio de consumo e custos na Vercel.
- **Possibilidade de Correção:** Decisão pausada/aceita.
- **Status:** `ACCEPTED` (Decisão de infraestrutura/custos mantida).
