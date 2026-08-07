# Canonical Technical Reference — Product Discovery & Search Experience

> **Módulo:** `apps/api/src/modules/catalog` & `apps/marketplace`  
> **Status:** `certified`  
> **Localização:** `.ai/domain/PRODUCT_DISCOVERY_SEARCH_EXPERIENCE.md`
> **Baselines de Referência Histórica:**
> - **Product Discovery Engine:** `apps/api/src/modules/catalog/discovery.service.ts` (`0f9d52d6e02e606ed2e625508a91e7919a0fae63`)
> - **Search Experience Certificada:** `apps/marketplace/src/components/search/marketplace-search.tsx` (`69c7416ba35c50b73f8b8dd36eebc61686b7ba9c`)

---

## 1. Resumo Executivo

O sistema de Descoberta de Produtos (**Product Discovery**) e a Experiência de Busca (**Search Experience**) constituem o motor central de navegação e localização de itens no Marketplace VERTTEX.

### Fluxo de Execução da Busca

```text
MarketplaceHeader / MarketplaceSearch (UI)
        │
        ├── [Foco / Query Vazia (<2 chars)] ──► Pesquisas Recentes (localStorage: verttex:search:recent:v1)
        │
        ├── [Digitação (>=2 chars)] ──────────► Autocomplete Textual (GET /public/catalog/search-suggestions)
        │
        └── [Submit / Enter / Seleção] ──────► Redirecionamento para /busca?q=...
                                                      │
                                                      ▼
                                            Product Discovery Engine (API)
                                                      │
                                                      ├── Normalização (normalizeSearchText)
                                                      ├── Search Projection (ProductSearchDocument)
                                                      ├── Multi-term AND & Weighted Ranking (1000/500/200/100/50)
                                                      ├── Facetas Disjuntivas (COUNT DISTINCT product)
                                                      ├── Validação de Disponibilidade Comercial (FEFO / Lotes)
                                                      └── Resposta Paginada Orientada por Intenção
```

### Invariantes Principais
1. **Autocomplete NÃO é Product Discovery:** O autocomplete é um serviço de sugestão textual ultrarrápido (take 50, zero estoque/mídia/FEFO) que antecede a busca real.
2. **Recent Searches NÃO pertencem ao Backend:** O histórico de pesquisas é gerenciado 100% no cliente (`localStorage`), com tratamento resiliente contra erros de SSR, JSON corrompido e `SecurityError`.
3. **Product Discovery é a Autoridade Canônica:** Toda listagem e decisão de ordenação/estoque/preço final é processada no servidor através do `PublicDiscoveryService`.

---

## 2. Linha do Tempo Técnica de Evolução

```text
Product Discovery Inicial (Busca legada)
  │
  ├──► Prisma-only Search Projection (ProductSearchDocument + ProductSearchIndexService)
  ├──► Algoritmo de Ranking Ponderado (Exact SKU > Title > Context > Attributes > Description)
  ├──► Facetas Dinâmicas Disjuntivas (OR interna / AND externa por produto distinto)
  ├──► Boundary de Aliases HTTP (q > search > query)
  ├──► Correção da busca por SKU/Barcode (Mapeado em ProductVariation, não Product)
  ├──► Fechamento e Recertificação do Product Discovery (Baseline 0f9d52d6e)
  │
Search Experience Integration
  │
  ├──► Local Storage Manager Resiliente (recent-searches.ts / verttex:search:recent:v1)
  ├──► Service de Autocomplete Textual (SearchSuggestionsService / kandidatos com nome humano)
  ├──► Destaque de Texto no Autocomplete (Trecho digitado font-normal + complemento font-bold)
  ├──► Proteções de Concorrência (200ms debounce + AbortSignal + stale query protection)
  ├──► Acessibilidade ARIA Semântica (combobox + listbox + remoção fora do role=option e listbox)
  ├──► Limpeza de Tooling (Remoção de mutações de tsconfig.json nos scripts de testes/lint)
  └──► Fechamento e Recertificação Global (Baseline 69c7416ba)
```

---

## 3. Arquitetura Atual

### 3.1 Camada Frontend (`apps/marketplace`)

- **[`MarketplaceHeader`]`apps/marketplace/src/components/layout/marketplace-header.tsx`:** Renderiza a barra superior do Marketplace, integrando o componente de busca com alinhamento responsivo em breakpoint `56rem`.
- **[`MarketplaceSearch`]`apps/marketplace/src/components/search/marketplace-search.tsx`:** Componente combobox unificado (desktop/mobile) responsável por capturar o input, gerenciar foco, teclas de atalho (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`, `Tab`), reatividade do dropdown e formatação visual dos destaques.
- **[`recent-searches.ts`]`apps/marketplace/src/lib/recent-searches.ts` & [`useRecentSearches`]`apps/marketplace/src/hooks/use-recent-searches.ts`:** Gerenciador do histórico local de buscas sob a chave `verttex:search:recent:v1`.
- **[`useSearchSuggestions`]`apps/marketplace/src/hooks/use-search-suggestions.ts`:** Hook TanStack Query que consome `/public/catalog/search-suggestions`, integrado com `AbortSignal` e tempo de `staleTime: 60s`.
- **[`ProductDiscoveryView`]`apps/marketplace/src/components/products/product-discovery-view.tsx`:** View da página `/busca` responsável por exibir produtos, barra lateral de facetas, ordenação e estado de busca vazia.

### 3.2 Camada Backend (`apps/api`)

- **[`catalog.routes.ts`]`apps/api/src/modules/catalog/catalog.routes.ts` & [`catalog.controller.ts`]`apps/api/src/modules/catalog/catalog.controller.ts`:** Expõem as rotas públicas `/public/catalog/discover` e `/public/catalog/search-suggestions`.
- **[`SearchSuggestionsService`]`apps/api/src/modules/catalog/search-suggestions.service.ts`:** Executa a busca rápida de termos candidatos via `ProductSearchDocument`, projetando os nomes originais em maiúsculas/minúsculas/acentos das entidades `Product`, `Category`, `Brand`, `Store` e `ProductOptionValue`.
- **[`discovery.service.ts` (`PublicDiscoveryService`)]`apps/api/src/modules/catalog/discovery.service.ts`:** Motor completo do Product Discovery responsável por parsing de parâmetros, ordenação textual/comercial, facetas disjuntivas, paginação e checagem de estoque comercial (FEFO).
- **[`product-search-index.service.ts` (`ProductSearchIndexService`)]`apps/api/src/modules/catalog/product-search-index.service.ts`:** Serviço encarregado da normalização universal `normalizeSearchText()` e manutenção da projeção `ProductSearchDocument`.

---

## 4. Product Discovery — Especificações Canônicas

### 4.1 Boundary de Aliases HTTP
A API aceita os seguintes parâmetros de consulta para termo textual:
- `q`
- `search`
- `query`

**Precedência:** `q > search > query`.  
Dentro do `PublicDiscoveryService`, após passar pelo Controller, o termo é unificado sob a propriedade canônica `search`.

### 4.2 Busca Exata por SKU e Código de Barras
- **Localização dos Dados:** SKU (`sku`) e Código de Barras (`barcode`) pertencem exclusivamente ao modelo `ProductVariation` (e **NÃO** ao modelo `Product`).
- **Peso de Correspondência Exata:** `1000`.
- **Invariante Histórico:** Consultas à busca por SKU/barcode devem obrigatoriamente juntar com `variations` via Prisma Client para evitar erros runtime de campo inexistente em `Product`.

### 4.3 Tabela de Pesos do Ranking Canônico (`SEARCH_FIELD_WEIGHTS`)

| Campo de Correspondência | Peso Base Canônico | Pontuação com Bônus Textual |
| :--- | :--- | :--- |
| **Exact SKU / Barcode** | `1000` | `1000` |
| **Title** (`titleNormalized`) | `500` | `510` |
| **Context** (`contextNormalized` — Marca / Categoria / Loja) | `200` | `210` |
| **Attributes** (`attributesNormalized` — Atributos e Opções) | `100` | `110` |
| **Description** (`descriptionNormalized`) | `50` | `60` |

> **Fonte Única de Verdade:** Todos os cálculos utilizam a constante exported `SEARCH_FIELD_WEIGHTS` em [`discovery.service.ts`]`apps/api/src/modules/catalog/discovery.service.ts`. É proibido reintroduzir números mágicos hardcoded.

### 4.4 Incidente Documentado: Regressão do Peso de Contexto (200 → 300)
- **Ocorrência:** Durante uma limpeza de ESLint/tipagem, a função `calculateProductRelevance` teve o peso de `context` alterado inadvertidamente de `200` para `300`.
- **Falha de Detecção:** Os testes originais verificavam apenas a ordem relativa `Title > Context > Attributes`. Como `500 > 300 > 100`, a alteração não quebrou os testes de ordenação relativa.
- **Correção Adotada:** Unificação sob `SEARCH_FIELD_WEIGHTS` e criação de testes comportamentais numéricos que validam a pontuação exata (`510`, `210`, `110`, `60`).
- **Lição Aprendida:** Requisitos com valores exatos devem ser validados por testes comportamentais com asserções numéricas estritas, não apenas checagem de ordem.

---

## 5. Algoritmo de Normalização e Projeção (`ProductSearchDocument`)

### 5.1 Especificação de `normalizeSearchText()`
Toda comparação textual no sistema de busca utiliza a mesma transformação em [`product-search-index.service.ts`]`apps/api/src/modules/catalog/product-search-index.service.ts`:
1. Decomposição Unicode NFD (`normalize('NFD')`).
2. Remoção de diacríticos/acentos (`replace(/[\u0300-\u036f]/g, '')`).
3. Conversão para minúsculas (`toLowerCase()`).
4. Substituição de pontuações, hífens e caracteres especiais por espaço.
5. Remapeamento de múltiplos espaços consecutivos para um único espaço e `trim()`.

**Exemplos:**
- `"Cachaça"` ➔ `"cachaca"`
- `"DOCE-DE-LEITE"` ➔ `"doce de leite"`
- `"  Mel   Silvestre "` ➔ `"mel silvestre"`

### 5.2 Estrutura da Projeção `ProductSearchDocument`
A tabela `product_search_documents` funciona como um índice secundário de busca 100% gerenciado via Prisma Client (Zero Raw SQL):
- `titleNormalized`: Nome do produto normalizado.
- `contextNormalized`: Concatenação de Marca, Categoria e Loja.
- `attributesNormalized`: Opções de variações e atributos técnicos.
- `descriptionNormalized`: Descrição resumida.
- `searchTextNormalized`: União de todos os campos para busca multi-termo `AND`.

> **Invariante de Exibição:** `ProductSearchDocument` é uma tabela de projeção para pesquisa, **NUNCA** uma fonte de apresentação. Textos normalizados (ex: `cachaca artesanal`) jamais devem ser exibidos na UI. O sistema deve sempre projetar o texto humano original (ex: `Cachaça Artesanal`).

---

## 6. Facetas Dinâmicas e Filtros Desagregados

### 6.1 Regra Semântica das Facetas
- **Mesma Faceta:** Acúmulo via operador lógico **`OR`** (ex: Madeira `Amburana OR Carvalho`).
- **Facetas Diferentes:** Combinação via operador lógico **`AND`** (ex: `(Amburana OR Carvalho) AND (Volume 500ml OR 750ml)`).

### 6.2 Contagem por Produto Distinto e Validação de Variantes
- **Unidade de Contagem:** `COUNT DISTINCT product` (evita que um produto com 5 variações infle a contagem da faceta em +5).
- **Self-Excluding Counts:** As contagens de uma faceta calculam quantos produtos distintos estariam disponíveis se aquele filtro específico fosse alternado, sem sofrer interferência das escolhas da própria faceta.

### 6.3 Incidente Documentado: Refatoração do `variantMatchesAttributes`
- **Ocorrência:** Uma refatoração de lint simplificou o método `variantMatchesAttributes` para comparação ingênua baseada em slugs concatenados.
- **Consequência:** A alteração quebrou a suíte de testes de facetas (3 testes falharam).
- **Correção Adotada:** Reversão e implementação da comparação precisa usando `normalizeSearchText()`, comparando `option.name` e `value` de forma independente.
- **Lição Aprendida:** Refatorações sintáticas não podem alterar a lógica de cruzamento de atributos de variantes comerciais.

---

## 7. Regras Comerciais, Ofertas e Paridade (D-01 a D-07)

### 7.1 Disponibilidade Comercial e FEFO
- **Checagem de Estoque:** Integração com `calculateBatchCommercialStock()` para filtrar lotes vencidos, em quarentena ou abaixo do minimum shelf-life.
- **Comportamento no Discovery:** Avalia disponibilidade mas **NÃO cria reserva** de estoque. Produtos esgotados recebem a flag `isAvailable: false` (ou badge "Esgotado").

### 7.2 Mapeamento do Sub-módulo de Ofertas
- **Regra de Oferta:** `promotionalPrice !== null && promotionalPrice < price`.
- **Rota `/ofertas`:** Força automaticamente o filtro `isOffer: true` no `PublicDiscoveryService`.

### 7.3 Matriz de Paridade (D-01 a D-07)

| Código | Descrição da Paridade | Propósito / Regressão Evitada |
| :--- | :--- | :--- |
| **D-01** | `attr_* boundary normalization` | Garante que parâmetros dinâmicos de URL `attr_cor=azul` sejam normalizados corretamente. |
| **D-02** | `/ofertas` ➔ `isOffer=true` | Evita que a página de ofertas vire uma listagem genérica sem filtro promocional. |
| **D-03** | `category sidebar` ➔ `categorySlug` | Garante que a barra lateral respeite o slug da categoria corrente na hierarquia. |
| **D-04** | `isAvailable` ➔ `ProductCard / Esgotado` | Exibe o badge visual de produto indisponível sem removê-lo da listagem quando configurado. |
| **D-05** | `hierarquia completa` ➔ `slugs.join('/')` | Valida o caminho completo dos breadcrumbs em categorias aninhadas. |
| **D-06** | `minPrice / maxPrice` frontend | Sincroniza a faixa de preço digitada no frontend com os filtros numéricos da API. |
| **D-07** | Acúmulo de `OR` na mesma faceta | Permite selecionar múltiplos valores em uma mesma faceta e remover individualmente. |

---

## 8. Search Experience — Autocomplete & Pesquisas Recentes

### 8.1 Histórico de Pesquisas Recentes (`recent-searches.ts`)
- **Chave de Armazenamento:** `verttex:search:recent:v1`.
- **Regras:** Máximo de 6 itens, ordenação decrescente (mais recente primeiro), `trim()`, remoção de duplicatas (case e accent insensitive), substituição de posição ao repetir termo.
- **Gatilhos de Salvamento:** Salva **APENAS** na submissão manual por Enter, clique no botão de buscar, clique em uma sugestão do autocomplete ou clique em um item recente. **NUNCA salva no evento `onChange`**.
- **Resiliência:** Funções envelopadas por `try/catch` para suportar SSR, `window` indefinido, `localStorage` bloqueado ou `SecurityError`.

### 8.2 Autocomplete Textual (`SearchSuggestionsService`)
- **Endpoint:** `GET /public/catalog/search-suggestions?q=...&limit=...`
- **Limites de Exibição:** Mobile (`< 56rem`) max 6, Desktop (`>= 56rem`) max 8, Teto da API max 10.
- **Candidate Take:** O service consulta `take: 50` em `ProductSearchDocument` ordenado por `productId asc` e extrai os nomes originais das entidades relacionadas.
- **Ranking do Autocomplete:**
  1. `Exact Match` (Correspondência exata)
  2. `StartsWith` (Termo começa com a busca)
  3. `WordStartsWith` (Alguma palavra começa com a busca)
  4. `Contains` (Contém a busca)
- **Formatação Visual (Destaque de Texto):**
  - Trecho correspondente à busca do usuário: `font-normal` (peso regular).
  - Complemento / sufixo da palavra: `font-bold` (negrito).

---

## 9. Proteções de Concorrência e Performance no Autocomplete

### 9.1 Debounce e Cancelamento de Requisições
- **Debounce:** `200ms` de espera na digitação para evitar rajadas de requisições por tecla.
- **`AbortSignal`:** O hook `useSearchSuggestions` repassa o `signal` do TanStack Query para o `apiClient`. Quando o usuário digita uma nova letra antes da resposta anterior chegar, o navegador cancela a requisição HTTP em trânsito.

### 9.2 Prevenção de Stale Suggestions (Stale Query Protection)
- **Cenário de Corrida:** O usuário digita `"cacha"`, as sugestões chegam e o item 0 fica destacado. O usuário continua digitando `"cachaca"` e pressiona Enter antes de decorrerem os 200ms de debounce.
- **Proteção Implementada:** Comparação estrita entre `normQuery !== normDebounced`. Enquanto a query digitada for diferente da query debounced:
  1. As sugestões antigas são imediatamente ocultadas.
  2. A seleção de teclado (`activeIndex`) é resetada para `-1`.
  3. O evento `Enter` submete o texto digitado atualmente (`query`), jamais uma sugestão da requisição antiga.

---

## 10. Acessibilidade ARIA e Semântica de Interface

### 10.1 Estrutura ARIA Canônica
- **Campo de Busca:** `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded={boolean}`.
- **Lista de Sugestões:** `id={listboxId}`, `role="listbox"`.
- **Itens Sugeridos:** `id={optionId}`, `role="option"`, `aria-selected={boolean}`.

### 10.2 Lições Aprendidas de Estruturação ARIA
1. **`aria-activedescendant` Condicional:** Apenas é emitido no input quando o item selecionado (`role="option"`) existe de fato no DOM renderizado.
2. **`aria-controls` Condicional:** Apenas é emitido no input quando a lista (`role="listbox"`) está visível no DOM.
3. **Isolamento de Controles Auxiliares:** Os botões de remoção individual de pesquisas recentes e o botão limpar são renderizados em divs de overlay **FORA** de `role="listbox"` e **FORA** de `role="option"`, garantindo que a lista contenha unicamente opções válidas na árvore de acessibilidade.

---

## 11. Tooling & Estratégia de Quality Gate Canônico

### 11.1 Integridade dos Scripts do Monorepo
Fica estritamente proibido que scripts de teste ou lint alterem arquivos versionados (`tsconfig.json`, `package.json`). Os testes do Marketplace utilizam a transformação JSX via OXC no [`vitest.config.ts`]`apps/marketplace/vitest.config.ts`, mantendo `"jsx": "preserve"` no `tsconfig.json`.

### 11.2 Execução do Quality Gate (`pnpm verify`)
A validação oficial de qualquer alteração deve seguir a sequência não-mutante:

```bash
pnpm verify
```

Validação complementar de working tree limpo:

```bash
pnpm lint && git diff --exit-code
pnpm typecheck && git diff --exit-code
pnpm test && git diff --exit-code
pnpm build && git diff --exit-code
```

---

## 12. Guia de Troubleshooting — "Quando Algo Quebrar"

### 1. A busca por texto retorna o catálogo inteiro ou produtos incorretos
- **Causa Provável:** Falha no unboxing do parâmetro de busca (`q` vs `search` vs `query`).
- **Verificação:** Inspecionar `PublicDiscoveryService` em [`discovery.service.ts`]`apps/api/src/modules/catalog/discovery.service.ts`. Garantir que `canonicalSearch` seja extraído corretamente.

### 2. Erro do Prisma ao buscar por SKU ou código de barras
- **Causa Provável:** Tentativa de consultar `Product.sku` em vez de `ProductVariation.sku`.
- **Verificação:** Garantir que a busca inclua o relacionamento `variations: { some: { OR: [{ sku }, { barcode }] } }`.

### 3. As sugestões do autocomplete exibem texto em minúsculas sem acento
- **Causa Provável:** Uso direto dos campos `*Normalized` do `ProductSearchDocument` na projeção visual.
- **Verificação:** Confirmar que `SearchSuggestionsService` projeta `product.name`, `category.name`, `brand.name`, `store.name` e `options.values.value`.

### 4. Tecla Enter executa uma sugestão antiga após digitação rápida
- **Causa Provável:** Ausência de checagem do estado pendente de debounce.
- **Verificação:** Inspecionar `MarketplaceSearch` em [`marketplace-search.tsx`]`apps/marketplace/src/components/search/marketplace-search.tsx` e validar `isQueryPending = normQuery !== normDebounced`.

### 5. Botões de remover recente disparam a busca do produto
- **Causa Provável:** Falta de `e.stopPropagation()` no handler de clique do botão.
- **Verificação:** Verificar se o botão de remoção possui `onClick={(e) => { e.stopPropagation(); removeSearch(item); }}`.

### 6. Erro no console do navegador: "SecurityError: Access to localStorage is denied"
- **Causa Provável:** Navegador em modo anônimo estrito ou suporte a cookies de terceiros desativado.
- **Verificação:** Inspecionar [`recent-searches.ts`]`apps/marketplace/src/lib/recent-searches.ts` e garantir que o bloco `try/catch` retorne um array vazio fallback sem estourar exceção.

---

## 13. Guia de Orientação para Futuras Alterações

### Checklist Antes de Modificar
- [ ] Ler este documento de arquitetura em sua totalidade.
- [ ] Verificar a baseline de referência histórica no Git (`0f9d52d6` / `69c7416`).
- [ ] Garantir que o motor do Product Discovery permanece 100% Prisma Client (Zero Raw SQL).
- [ ] Validar se as alterações mantêm os pesos numéricos canônicos `1000/500/200/100/50`.

### Checklist Após a Implementação
- [ ] Executar a suíte de testes de catálogo: `pnpm --filter @verttex/api exec vitest run src/modules/catalog`
- [ ] Executar a suíte do Marketplace: `pnpm --filter @verttex/marketplace test`
- [ ] Executar o Quality Gate completo: `pnpm verify`
- [ ] Confirmar que o working tree permanece totalmente limpo: `git status` e `git diff --exit-code`
