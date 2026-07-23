# 023 — Notificações

## Metadata

- Status: Planned
- Priority: Medium
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/018-orders-and-checkout.md`](.ai/roadmaps/planned/018-orders-and-checkout.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Enviar notificações transacionais multicanal (E-mail, WhatsApp, Push no navegador) para vendedores (novo pedido, estoque baixo) e compradores (confirmação de pagamento, código de rastreio, pedido entregue).

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `011 — Núcleo`, `018 — Pedidos` e `020 — Entregas`.

## 3. Principais Responsabilidades

- Fila de disparos assíncronos (BullMQ / Redis) para não desacelerar as requisições HTTP da API.
- Templates HTML de e-mail responsivos e mensagens padronizadas de WhatsApp.
- Central de notificações e preferências de comunicação no perfil do usuário/cliente.

## 4. Decisões a Serem Tomadas no Futuro

- Provedores oficiais (Resend / AWS SES para e-mail; Twilio / Z-API para WhatsApp).

## 5. Riscos Conhecidos

- Falhas no envio de notificações críticas por instabilidade de APIs externas de e-mail/WhatsApp.
