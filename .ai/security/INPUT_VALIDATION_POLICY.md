# Política de Validação de Entrada — VERTTEX

> **Versão:** 1.0 — 2026-07-22

---

## 1. Princípio Geral

Todo dado externo é não confiável. A validação estrutural ocorre antes de qualquer lógica de negócio ou acesso ao banco.

---

## 2. Obrigações por Tipo de Input

### Body (JSON)

- Schema Zod obrigatório em toda rota que recebe body
- Usar `.strict()` ou `.strip()` para rejeitar/ignorar campos desconhecidos
- `string()`: sempre `min(1)` e `max(N)` explícito
- `number()`: sempre `min(N)` e `max(N)`
- Enumerações: sempre `z.enum([...])`
- Arrays: sempre `min(0)` e `max(N)` items

### Params (`/rota/:id`)

- Validar formato UUID quando esperado: `z.string().uuid()`

### Query String

- Validar todos os parâmetros de busca, filtro, paginação
- `page`: `z.coerce.number().min(1).default(1)`
- `perPage`: `z.coerce.number().min(1).max(100).default(20)`

### Headers

- Validar apenas quando utilizados na lógica de negócio

---

## 3. Limites de Paginação

| Parâmetro | Padrão | Máximo |
| :-------- | :----- | :----- |
| `page`    | 1      | —      |
| `perPage` | 20     | 100    |

**Nenhuma listagem retorna itens ilimitados.**

---

## 4. Limites de Body

| Tipo de rota  | Limite                              |
| :------------ | :---------------------------------- |
| Geral JSON    | 256 KB                              |
| Rotas simples | 64 KB                               |
| Upload        | Fluxo separado com limites por tipo |

---

## 5. Estado Atual

| Controle                                        | Status                             |
| :---------------------------------------------- | :--------------------------------- |
| Schema Zod em endpoints principais              | ✅                                 |
| `.strict()` generalizado                        | ❌ — usar `.strip()` padrão do Zod |
| Validação de params/query em todos os endpoints | ⚠️ Parcial                         |
| Body limit global explícito                     | ❌ — Fase 7                        |
| Limites de paginação                            | ⚠️ Parcial                         |

---

## 6. Regra: Sem Validação Assíncrona Inicial

Não realizar acesso ao banco dentro do validator de schema (preValidation). Validações de negócio e autorização ocorrem depois da validação estrutural, em hooks ou serviços. Risco: acesso ao banco antes de validação estrutural pode criar vetor de DoS.

---

## 7. Proibições

- Nunca usar `z.any()` para dados que chegam do cliente em endpoints de negócio
- Nunca confiar em `Content-Type` para determinar tipo de arquivo
- Nunca confiar em `filename` enviado pelo cliente
