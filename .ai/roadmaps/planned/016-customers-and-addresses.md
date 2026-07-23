# 016 — Clientes e Endereços

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`completed/004-customer-authentication.md`](.ai/roadmaps/completed/004-customer-authentication.md)

---

> **Observação Importante:** Este roadmap representa um registro conceitual da sequência futura de desenvolvimento do projeto VERTTEX NF. Ele será detalhado, analisado e implementado em uma etapa exclusiva posterior.

---

## 1. Objetivo Geral

Estruturar o perfil completo dos clientes compradores no Marketplace, permitindo o gerenciamento de múltiplos endereços de entrega (CEP, logradouro, número, complemento, bairro, cidade, estado) e dados cadastrais (CPF/CNPJ).

## 2. Dependências e Relação com Módulos Anteriores

- **Depende de:** `004 — Customer Authentication` (entidade `Customer` e rotas `/auth/customers`).

## 3. Principais Responsabilidades

- Tabela `customer_addresses` (`CustomerAddress`) para múltiplos endereços por cliente com marcação de endereço padrão.
- Validação de CPF/CNPJ e integração com API de consulta de CEP (ViaCEP / BrasilAPI).
- Gestão do perfil do cliente no Marketplace (`/perfil/enderecos`).

## 4. Decisões a Serem Tomadas no Futuro

- Validação de cobertura de entregas regionais por estado/cidade no momento do cadastro do endereço.

## 5. Riscos Conhecidos

- Vazamento de dados de PII (CPF e endereços) sem os devidos controles de autorização e escopo do próprio cliente.
