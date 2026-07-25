# Roadmap 014 — Estoque, Lotes, FEFO e Movimentações

> **Status:** `completed`  
> **Prioridade:** `high`  
> **Dependências:** `013 — Catálogo de Produtos, Variações, Mídias e Uploads R2`  
> **Caminho:** `.ai/roadmaps/completed/014-inventory-and-stock-movements.md`  

---

## 1. Objetivo Geral

Estruturar e gerenciar a quantidade de estoque físico por produto, variação, lote e localização (`StockItem`), controlando datas de fabricação/validade, política sanitária **FEFO** (*First Expired, First Out*), quarentena, bloqueios operacionais, descarte formal de vencidos e rastreabilidade total (recall).

---

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `013 — Catálogo de Produtos` (as configurações de rastreabilidade de validade `hasBatchControl`, `hasExpirationControl`, etc., são vinculadas aos produtos e variações).
- **Relaciona-se com:** `005 — Roles and Permissions` e `011 — Consolidação do Núcleo` (permissões de gestão de estoque/lotes e auditoria).

---

## 3. Principais Responsabilidades Entregues

1. **Configuração no Catálogo:** Permite definir por produto/variação se há exigência de controle por lote e validade, margem de recebimento, margem de entrega ao cliente e janela de alerta.
2. **Cadastro e Rastreabilidade de Lotes:** Registro da entidade `ProductLot` com código impresso, fabricante, fornecedor, fabricação, validade e situação operacional (`available`, `quarantine`, `blocked`, `recalled`).
3. **Estoque Multilocalização:** Registro do saldo em `StockItem` por `storeId`, `variationId`, `lotId` e `locationId`.
4. **Algoritmo FEFO:** Seleção e ordenação dos lotes por menor validade e desempate por recebimento, desconsiderando lotes vencidos, bloqueados, em quarentena ou com validade insuficiente para entrega.
5. **Recebimento de Mercadorias:** Interface e API de recebimento com divisão de quantidades entre lotes e validação de validade mínima.
6. **Ações Operacionais Auditadas:** Alteração de status (quarentena/bloqueio/recall), descarte formal por vencimento/dano e transferências entre localizações.
7. **Painel Administrativo no Manager:** Interface rica em `/estoque` com modais standalone de diálogo (`ReceivingFormDialog`, `StatusFormDialog`, `DiscardFormDialog`), cards de saldo físico vs. disponível, filtros, tabela envolvida por `TableWrapper` com paginação nativa e classe `cursor-pointer`.

---

## 4. Testes e Validação Evidenciada

- **Testes Unitários e de Integração:** `src/modules/stock/stock-integration.spec.ts`, `src/modules/lots/lots.spec.ts` e `src/modules/stock/stock.spec.ts` (análise temporal de validade, algoritmo FEFO, recebimento de lotes, descarte formal e movimentações).
- **Checagem de Tipos:** `pnpm typecheck` executado em todos os 9 pacotes do monorepo com 0 erros.
