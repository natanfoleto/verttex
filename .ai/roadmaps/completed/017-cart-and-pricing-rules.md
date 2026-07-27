# Roadmap 017 — Carrinho e Regras de Preço

> **Status:** `completed`  
> **Prioridade:** `high`  
> **Concluído em:** 2026-07-27  
> **Dependências:** `013 — Product Catalog, Media and Uploads`, `014 — Inventory and Stock Movements`, `016 — Customers and Addresses`  
> **Caminho:** `.ai/roadmaps/completed/017-cart-and-pricing-rules.md`  

---

## 1. Objetivo Geral

Gerenciar os carrinhos de compras dos clientes no Marketplace (**VERTTEX**), tanto para visitantes anônimos via `sessionId`/`cartToken` quanto para clientes autenticados (`Customer`), aplicando regras de preço, descontos promocionais, cupons de desconto (porcentagem ou valor fixo) e validação em tempo real de disponibilidade de estoque e regras de validade por FEFO sem bloqueio atômico prematuro.

---

## 2. Entregas Realizadas

### 2.1 Banco de Dados & Entidades (`apps/api/prisma/schema.prisma`)
- Models `Cart`, `CartItem`, `Coupon`, `CartCoupon` criados e sincronizados via `prisma db push` e `prisma generate`.

### 2.2 Backend API (`apps/api/src/modules/cart`)
- Endpoints `/cart`, `/cart/items`, `/cart/items/:id`, `/cart/coupon`, `/cart/coupon/:code` e `/cart/sync`.
- Agrupamento de itens por Loja Parceira (*Vendedor Artesanal*).
- Validação de estoque e quantidade disponível.
- Aplicação de cupons por porcentagem ou valor fixo, respeitando valor mínimo e limite de uso.
- Suíte de testes automatizados `cart.spec.ts` (100% aprovados).

### 2.3 Frontend Marketplace (`apps/marketplace`)
- Drawer do carrinho (`CartSheet`) com contador no cabeçalho.
- Componente `CartSkeleton` de Skeleton Loading (`animate-pulse`).
- Página dedicada do carrinho em `/carrinho` com agrupamento por loja parceira, formulário de cupom e resumo de preços.
