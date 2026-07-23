# 024 — Relatórios Comerciais e Operacionais

## Metadata

- Status: Planned
- Priority: Medium
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md), [`planned/019-payments.md`](.ai/roadmaps/planned/019-payments.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Oferecer dashboards executivos e relatórios de inteligência comercial para gestores das lojas e administradores da plataforma (faturamento, produtos mais vendidos, ticket médio, comissões, conversão).

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `013 — Catálogo`, `018 — Pedidos` e `019 — Pagamentos`.

## 3. Principais Responsabilidades

- Agregadores e dashboards visuais no Manager com gráficos e métricas filtráveis por período e por loja.
- Exportação de relatórios em formatos CSV / XLSX / PDF.
- Indicadores de curva ABC de produtos e retenção de clientes.

## 4. Decisões a Serem Tomadas no Futuro

- Estratégia de tabelas agregadas/materialized views para relatórios históricos sem sobrecarregar o banco OLTP principal.

## 5. Riscos Conhecidos

- Consultas analíticas pesadas afetando a performance das rotas OLTP operacionais se executadas sem tabelas agregadas ou réplicas de leitura.
