# Roadmap 029 — Search Experience (Autocomplete & Pesquisas Recentes)

> **Status:** `completed`  
> **Prioridade:** `high`  
> **Dependências:** Roadmap 027 (Product Discovery & Product Listing Engine)  
> **Módulo:** `apps/api/src/modules/catalog` & `apps/marketplace/src/components/search`  
> **Data de Conclusão:** 2026-07-23  
> **Caminho:** `.ai/roadmaps/completed/029-search-experience.md`  
> **Referência Técnica Canônica:** [PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md](../../domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md)

---

## 🎯 Objetivo

Implementar a experiência unificada de busca instantânea e autocomplete do Marketplace VERTTEX, integrando sugestões em tempo real (`/public/catalog/search-suggestions`), histórico local de pesquisas recentes (`verttex:search:recent:v1`) e navegação por teclado/mobile.

O detalhamento técnico completo da arquitetura, componentes, hooks, rotas e regras de negócios permanece centralizado no documento técnico de domínio:
[PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md](../../domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md).

---

## 📋 Escopo Entregue

1. **API de Sugestões / Autocomplete:** Endpoint público `GET /public/catalog/search-suggestions` alimentado pela projeção `ProductSearchDocument`.
2. **Componente `MarketplaceSearch`:** Interface combobox responsiva para desktop e mobile com acessibilidade via teclado (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Tab`).
3. **Histórico de Buscas Recentes:** Armazenamento em `localStorage` sob a chave `verttex:search:recent:v1` via hook `useRecentSearches`.
4. **Resiliência e Cache:** `useSearchSuggestions` com `staleTime: 60s` e cancelamento de requisições pendentes via `AbortSignal`.

---

## 🛡️ Critérios de Aceite

- Zero chamadas raw SQL.
- 100% de cobertura de acessibilidade por teclado no dropdown de sugestões.
- Histórico mantido no cliente com fallback seguro para falhas de `localStorage`.
