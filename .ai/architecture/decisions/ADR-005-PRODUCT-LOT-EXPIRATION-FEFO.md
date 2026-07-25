# ADR 005 — Controle de Lotes, Validade, Algoritmo FEFO e Rastreabilidade de Estoque

- **Status:** Aceito
- **Data:** 2026-07-25
- **Autores:** Equipe de Arquitetura VERTTEX
- **Roadmap Relacionado:** `014 — Estoque e Movimentações`

---

## 1. Contexto

A plataforma VERTTEX atende lojistas e fornecedores parceiros que comercializam produtos artesanais e alimentícios. Esses produtos possuem prazos de validade determinados pelo fabricante e exigem controle sanitário, rastreabilidade e priorização de saída dos itens com vencimento mais próximo.

A estrutura inicial de catálogo mantinha apenas saldo total de estoque vinculado à variação do produto (`ProductVariation`). Essa modelagem era insuficiente para:

1. Tratar múltiplos lotes simultâneos com validades diferentes para um mesmo produto.
2. Garantir que produtos vencidos ou sem prazo hábil de entrega não sejam vendidos ao consumidor.
3. Rastrear de qual fornecedor/fabricante veio determinado lote e quais clientes o receberam.
4. Aplicar a política sanitária e operacional **FEFO** (_First Expired, First Out_).

---

## 2. Decisões Arquiteturais Tomadas

### 2.1 A Validade Pertence ao Lote, Não ao Produto

- **Decisão:** A data de validade não deve ser armazenada diretamente como um campo fixo da entidade `Product` ou `ProductVariation`.
- **Justificativa:** Um mesmo produto possui múltiplos lotes fabricados em momentos distintos. O produto define as **regras de controle** (`hasBatchControl`, `hasExpirationControl`, `minReceivingShelfLifeDays`, `minDeliveryShelfLifeDays`, `warningShelfLifeDays`), enquanto a entidade `ProductLot` contém a **validade real declarada pelo fabricante**.

### 2.2 Estoque Separado por Produto, Lote e Localização Física

- **Decisão:** O saldo de estoque é representado pela entidade `StockItem`, vinculada a `storeId`, `variationId`, `lotId` (opcional) e `locationId` (localização no depósito).
- **Justificativa:** Permite localização física precisa no armazém e separação entre saldo físico total, saldo reservado e saldo comercializável disponível.

### 2.3 Algoritmo FEFO (_First Expired, First Out_)

- **Decisão:** Na seleção e reserva de estoque para vendas, o sistema prioriza obrigatoriamente os lotes com **menor data de validade** (primeiro que vence, primeiro que sai), com desempate por menor data de recebimento.
- **Elegibilidade Comercial:** Um lote só compõe o estoque disponível se:
  1. Estiver com situação operacional `available` (liberado).
  2. Não estiver vencido (`expirationDate >= hoje`).
  3. Possuir validade restante maior ou igual à validade mínima exigida na entrega ao cliente (`expirationDate >= dataEstimadaEntrega + minDeliveryShelfLifeDays`).

### 2.4 Permanência Auditada de Lotes Vencidos no Estoque Físico

- **Decisão:** Lotes vencidos não desaparecem nem são excluídos automaticamente do banco de dados ou estoque físico.
- **Justificativa:** O lote vencido deixa de ser comercializável imediatamente, mas continua existindo no saldo físico do depósito até que seja realizada uma **movimentação formal de descarte, devolução ao fornecedor ou ajuste autorizados**, devidamente auditada.

---

## 3. Consequências

- **Positivas:**
  - Garantia de conformidade sanitária e proteção jurídica para os lojistas e para a Verttex.
  - Rastreabilidade total (recall) desde o recebimento do fornecedor até o envio ao cliente final.
  - Otimização do giro de estoque com redução de perdas por vencimento.
- **Impacto em Módulos Futuros:**
  - **Carrinho e Pedidos (Roadmaps 017/018):** Devem realizar reservas atômicas via FEFO.
  - **Entregas (Roadmap 020):** Devem validar se a data estimada de entrega respeita a margem do lote expedido.
  - **Devoluções (Roadmap 021):** Devem encaminhar itens alimentícios devolvidos para quarentena obrigatória.
