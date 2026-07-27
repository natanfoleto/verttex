# Roadmap 016 — Clientes e Endereços

> **Status:** `completed`  
> **Prioridade:** `high`  
> **Criado em:** 2026-07-23  
> **Iniciado em:** 2026-07-27  
> **Concluído em:** 2026-07-27  
> **Dependências:** `004 — Customer Authentication`  
> **Caminho:** `.ai/roadmaps/completed/016-customers-and-addresses.md`  

---

## 1. Objetivo Geral

Estruturar o perfil completo dos clientes compradores no Marketplace (**VERTTEX**), permitindo o gerenciamento de dados cadastrais (CPF/CNPJ com validação de dígitos verificadores) e múltiplos endereços de entrega (CEP, logradouro, número, complemento, bairro, cidade, estado) com busca automática por CEP (ViaCEP / BrasilAPI) e definição de endereço padrão.

---

## 2. O que foi Implementado

### 2.1 Banco de Dados & Prisma (`apps/api/prisma/schema.prisma`)
- **Atualização da entidade `Customer`**: Adição dos campos `cpfCnpj` e `birthDate`.
- **Nova entidade `CustomerAddress` (`customer_addresses`)**: Suporte a múltiplos endereços por cliente com campos `label`, `recipient`, `phone`, `zipCode`, `street`, `number`, `complement`, `neighborhood`, `city`, `state` (UF) e `isDefault`.

### 2.2 Backend API (`apps/api/src/modules/customer`)
- **Validador de CPF/CNPJ (`cpf-cnpj.ts`)**: Validação de dígitos verificadores para CPF e CNPJ.
- **Serviço de Consulta de CEP (`cep.service.ts`)**: Integração de CEP com fallback resiliente (ViaCEP -> BrasilAPI).
- **CRUD de Endereços (`customer-addresses.service.ts`)**: Endpoints sob `/customer/addresses` com garantia de endereço padrão único por cliente e isolamento tenant por `customerId`.
- **Atualização de Perfil (`PATCH /customer/profile`)**: Atualização de nome, telefone e CPF/CNPJ.
- **Testes Automatizados (`customer-addresses.spec.ts`)**: Cobertura Vitest de CPF/CNPJ e validações.

### 2.3 Frontend Marketplace (`apps/marketplace`)
- **Página de Perfil (`/perfil`)**: Atualização de dados cadastrais com CPF/CNPJ e navegação por abas.
- **Página de Endereços (`/perfil/enderecos`)**: Gerenciamento completo de endereços salvos com selo de Endereço Padrão, modal de criação/edição e **auto-preenchimento por CEP em tempo real**.

---

## 3. Validação e Qualidade

- **Compilação TypeScript**: `pnpm typecheck` — 9 pacotes compilados com 0 erros.
- **Suíte de Testes Vitest**: `pnpm --filter @verttex/api test` — 51 testes aprovados em 20 suítes.
