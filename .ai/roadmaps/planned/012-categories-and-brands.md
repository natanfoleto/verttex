# 012 — Categorias e Marcas

## Metadata

- Status: Planned
- Priority: High
- Created at: 2026-07-23
- Started at: Não iniciado
- Completed at: Em aberto
- Dependencies: [`planned/011-core-consolidation.md`](.ai/roadmaps/planned/011-core-consolidation.md)
- Related documents: `.ai/architecture/ARCHITECTURE.md`, `.ai/domain/BUSINESS_RULES.md`, `.ai/domain/PERMISSIONS.md`

---

## Context

Para viabilizar a organização dos produtos no ecossistema VERTTEX, faz-se necessário estruturar a taxonomia comercial da plataforma. O módulo de **Categorias e Marcas** define a classificação hierárquica e a identificação de fabricantes/marcas dos itens comercializados pelas lojas no Marketplace.

---

## Decisões de Arquitetura e Escopo

1. **Taxonomia Global de Categorias:**
   - As categorias pertencem à **plataforma global** (gerenciadas por administradores internos).
   - Isso garante uma árvore taxonômica padronizada e navegável no Marketplace, impedindo a criação desordenada de categorias duplicadas ou confusas por cada loja.
2. **Cadastro Global de Marcas:**
   - As marcas são cadastradas globalmente no repositório reutilizável da plataforma.
   - Produtos de qualquer loja podem vincular-se a uma marca cadastrada (vínculo opcional).
3. **Gerenciamento Administrativo:**
   - Apenas usuários com permissões específicas (`category.create`, `category.update`, `brand.create`, `brand.update`) podem gerenciar a árvore de categorias e o catálogo de marcas no Manager.

---

## Modelagem Proposta do Banco de Dados

### 1. Tabela `categories` (`Category`)

| Campo | Tipo | Nulo | Padrão | Descrição / Regra |
|:---|:---|:---|:---|:---|
| `id` | `String` (cuid) | Não | `cuid()` | Chave primária |
| `name` | `String` | Não | - | Nome da categoria (ex: "Queijos Artesanais") |
| `slug` | `String` | Não | - | Único globalmente (`@unique`). Usado em URLs públicas |
| `description` | `String` | Sim | `null` | Descrição rica da categoria |
| `imageUrl` | `String` | Sim | `null` | URL da imagem/banner da categoria |
| `iconUrl` | `String` | Sim | `null` | URL do ícone vetorial da categoria |
| `parentId` | `String` | Sim | `null` | ID da categoria pai (auto-relacionamento). `null` para categorias raiz |
| `position` | `Int` | Não | `0` | Ordem de exibição entre categorias irmãs |
| `status` | `String` | Não | `"active"` | Enum: `"active"`, `"inactive"` |
| `isVisible` | `Boolean` | Não | `true` | Se a categoria é visível na navegação do Marketplace |
| `metaTitle` | `String` | Sim | `null` | Título otimizado para SEO |
| `metaDescription` | `String` | Sim | `null` | Descrição otimizada para SEO |
| `createdBy` | `String` | Sim | `null` | ID do `User` criador |
| `updatedBy` | `String` | Sim | `null` | ID do `User` da última alteração |
| `deletedAt` | `DateTime` | Sim | `null` | Data de exclusão lógica (soft-delete) |
| `deletedBy` | `String` | Sim | `null` | ID do `User` que executou a exclusão |
| `createdAt` | `DateTime` | Não | `now()` | Timestamp de criação |
| `updatedAt` | `DateTime` | Não | `@updatedAt` | Timestamp de atualização |

**Índices e Chaves Especiais:**
- `@unique([slug])`
- `@@index([parentId])`
- `@@index([status])`
- `@@index([position])`

---

### 2. Tabela `brands` (`Brand`)

| Campo | Tipo | Nulo | Padrão | Descrição / Regra |
|:---|:---|:---|:---|:---|
| `id` | `String` (cuid) | Não | `cuid()` | Chave primária |
| `name` | `String` | Não | - | Nome da marca (ex: "Queijaria Alvorada") |
| `slug` | `String` | Não | - | Único globalmente (`@unique`) |
| `description` | `String` | Sim | `null` | Descrição ou história da marca |
| `logoUrl` | `String` | Sim | `null` | URL do logotipo |
| `status` | `String` | Não | `"active"` | Enum: `"active"`, `"inactive"` |
| `isVisible` | `Boolean` | Não | `true` | Visibilidade no filtro de marcas do Marketplace |
| `metaTitle` | `String` | Sim | `null` | Título para SEO |
| `metaDescription` | `String` | Sim | `null` | Meta descrição para SEO |
| `createdBy` | `String` | Sim | `null` | ID do `User` criador |
| `updatedBy` | `String` | Sim | `null` | ID do `User` da última alteração |
| `deletedAt` | `DateTime` | Sim | `null` | Data de exclusão lógica (soft-delete) |
| `deletedBy` | `String` | Sim | `null` | ID do `User` que executou a exclusão |
| `createdAt` | `DateTime` | Não | `now()` | Timestamp de criação |
| `updatedAt` | `DateTime` | Não | `@updatedAt` | Timestamp de atualização |

**Índices e Chaves Especiais:**
- `@unique([slug])`
- `@@index([status])`
- `@@index([name])`

---

## Regras de Negócio e Comportamentos

### Hierarquia de Categorias
1. **Profundidade Máxima:** Recomenda-se limite de até 3 níveis de profundidade (Raiz -> Categoria -> Subcategoria).
2. **Prevenção de Ciclos:** A API deve validar que uma categoria nunca seja definida como filha de si mesma ou de uma de suas subcategorias descendentes.
3. **Arquivamento e Exclusão:**
   - Se uma categoria contiver subcategorias ativas ou produtos vinculados, a exclusão física é impedida e a categoria é desativada/arquivada (`status: "inactive"`).
   - Se a categoria não possuir vínculos comerciais, permite-se o soft-delete (`deletedAt = now()`).

### Permissões Exigidas (`@verttex/auth`)

As seguintes permissões serão adicionadas a `packages/auth`:
- `category.read` (`read:Category`)
- `category.create` (`create:Category`)
- `category.update` (`update:Category`)
- `category.archive` (`archive:Category`)
- `brand.read` (`read:Brand`)
- `brand.create` (`create:Brand`)
- `brand.update` (`update:Brand`)
- `brand.archive` (`archive:Brand`)

---

## Interface no Manager (Planejada)

1. **Gestão de Categorias (`/categorias`):**
   - Exibição da árvore taxonômica interativa (drag & drop para reordenação de posições).
   - Modal de criação/edição com seleção de categoria pai, upload de ícone/imagem e SEO.
2. **Gestão de Marcas (`/marcas`):**
   - Tabela de marcas com filtro de busca, estatísticas de produtos vinculados e upload de logo.

---

## Auditoria (`logAudit`)

Ações que obrigatoriamente gerarão log de auditoria:
- `CREATE_CATEGORY`, `UPDATE_CATEGORY`, `ARCHIVE_CATEGORY`, `REORDER_CATEGORIES`
- `CREATE_BRAND`, `UPDATE_BRAND`, `ARCHIVE_BRAND`
