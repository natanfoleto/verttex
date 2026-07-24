# 013 — Catálogo de Produtos, Variações, Mídias e Uploads R2

## Metadata

- Status: Active
- Priority: High
- Created at: 2026-07-23
- Started at: 2026-07-23
- Completed at: Em aberto
- Dependencies: [`completed/011-core-consolidation.md`](.ai/roadmaps/completed/011-core-consolidation.md), [`completed/012-categories-and-brands.md`](.ai/roadmaps/completed/012-categories-and-brands.md)
- Related documents: `.ai/architecture/ARCHITECTURE.md`, `.ai/security/FILE_UPLOAD_SECURITY.md`, `.ai/domain/BUSINESS_RULES.md`

---

## Context

O **Catálogo de Produtos** é o coração comercial do ecossistema VERTTEX. Ele permite que lojas cadastrem produtos artesanais e regionais, configurem preços, variações (tamanho, peso, sabor) e gerenciem mídias digitais com armazenamento de alta performance e baixo custo via **Cloudflare R2**.

---

## 1. Arquitetura Geral do Catálogo

1. **Catálogo Multi-Loja:**
   - Cada produto pertence estritamente a uma loja (`storeId`).
   - Categorias e Marcas são entidades reutilizáveis da plataforma global.
2. **Produtos Simples e Variáveis:**
   - **Produto Simples:** Possui exatamente 1 variação padrão gerada automaticamente no backend.
   - **Produto Variável:** Possui 1 ou mais opções (ex: Cor, Tamanho, Peso) e 2 ou mais variações (combinações de valores).
   - *Decisão técnica:* Todos os preços, SKUs e estoques residem obrigatoriamente na entidade de **Variação (`ProductVariation`)**. Isso evita código duplicado e unifica a lógica de pedidos e checkout.
3. **Ciclo de Vida do Produto:**
   - `draft` (Rascunho) ──> `active` (Ativo no cadastro) ──> `published` (Visível no Marketplace) / `inactive` / `archived` (Arquivado/Histórico).

---

## 2. Modelagem Proposta do Banco de Dados

### Tabela `products` (`Product`)
- `id`: String (cuid, PK)
- `storeId`: String (FK -> `Store`, onDelete: Cascade)
- `categoryId`: String (FK -> `Category`)
- `brandId`: String? (FK -> `Brand`)
- `name`: String
- `slug`: String (`@unique([storeId, slug])` — slug único dentro da mesma loja)
- `shortDescription`: String?
- `fullDescription`: String? (@db.Text)
- `type`: String (`"simple"`, `"variable"`)
- `status`: String (`"draft"`, `"active"`, `"inactive"`, `"archived"`)
- `isPublished`: Boolean (`false`)
- `isFeatured`: Boolean (`false`)
- `weight`: Float? (em gramas)
- `width`: Float? (em cm)
- `height`: Float? (em cm)
- `length`: Float? (em cm)
- `metaTitle`: String?
- `metaDescription`: String?
- `createdBy`: String?
- `updatedBy`: String?
- `deletedAt`: DateTime?
- `createdAt`: DateTime (`now()`)
- `updatedAt`: DateTime (`@updatedAt`)

### Tabela `product_options` (`ProductOption`)
- `id`: String (cuid, PK)
- `productId`: String (FK -> `Product`, onDelete: Cascade)
- `name`: String (ex: "Sabor", "Peso", "Tamanho")
- `position`: Int (`0`)
- `createdAt`: DateTime (`now()`)

### Tabela `product_option_values` (`ProductOptionValue`)
- `id`: String (cuid, PK)
- `optionId`: String (FK -> `ProductOption`, onDelete: Cascade)
- `value`: String (ex: "Curado", "Meia Cura", "500g")
- `position`: Int (`0`)

### Tabela `product_variations` (`ProductVariation`)
- `id`: String (cuid, PK)
- `productId`: String (FK -> `Product`, onDelete: Cascade)
- `sku`: String (`@unique` — código SKU globalmente único)
- `barcode`: String? (GTIN/EAN opcional)
- `price`: Decimal (precisão 10,2)
- `promotionalPrice`: Decimal? (precisão 10,2)
- `costPrice`: Decimal? (precisão 10,2 - visível apenas para gestores autorizados)
- `isDefault`: Boolean (`false`)
- `status`: String (`"active"`, `"inactive"`)
- `weight`: Float?
- `width`: Float?
- `height`: Float?
- `length`: Float?
- `position`: Int (`0`)
- `deletedAt`: DateTime?
- `createdAt`: DateTime (`now()`)
- `updatedAt`: DateTime (`@updatedAt`)

### Tabela `product_variation_values` (`ProductVariationValue`)
- `id`: String (cuid, PK)
- `variationId`: String (FK -> `ProductVariation`, onDelete: Cascade)
- `optionValueId`: String (FK -> `ProductOptionValue`, onDelete: Cascade)

### Tabela `files` (`File` / Infraestrutura Reutilizável de Mídias)
- `id`: String (cuid, PK)
- `publicId`: String (`@unique` - UUID não previsível)
- `provider`: String (`"cloudflare_r2"`)
- `bucket`: String
- `objectKey`: String (`@unique`)
- `originalName`: String
- `extension`: String
- `mimeType`: String
- `size`: Int (em bytes)
- `checksum`: String? (SHA-256)
- `width`: Int? (para imagens)
- `height`: Int? (para imagens)
- `status`: String (`"pending"`, `"processing"`, `"approved"`, `"rejected"`)
- `purpose`: String (`"product_image"`, `"category_icon"`, `"brand_logo"`, `"store_logo"`)
- `storeId`: String? (FK -> `Store`)
- `userId`: String? (FK -> `User`)
- `deletedAt`: DateTime?
- `createdAt`: DateTime (`now()`)
- `updatedAt`: DateTime (`@updatedAt`)

### Tabela `product_medias` (`ProductMedia`)
- `id`: String (cuid, PK)
- `productId`: String (FK -> `Product`, onDelete: Cascade)
- `variationId`: String? (FK -> `ProductVariation`, onDelete: SetNull)
- `fileId`: String (FK -> `File`, onDelete: Cascade)
- `altText`: String?
- `position`: Int (`0`)
- `isMain`: Boolean (`false`)
- `createdAt`: DateTime (`now()`)

---

## 3. Infraestrutura Reutilizável de Uploads R2

### Arquitetura Escolhida: Modelo Híbrido com URL Assinada + Finalização
1. **Solicitação de Upload:** Frontend faz POST `/files/presigned-url` informando `fileName`, `mimeType`, `size` e `purpose`.
2. **Autorização & Validação:** API valida tamanho (máx 5 MB), extensão (allowlist: `jpg`, `png`, `webp`) e gera uma URL pré-assinada PUT direta para o Cloudflare R2 com expiração de 15 minutos.
3. **Upload Direto:** Frontend faz PUT diretamente no R2 sem sobrecarregar a memória da API Node.js.
4. **Finalização Server-Side:** Frontend chama POST `/files/:fileId/finalize`. A API lê os primeiros bytes do arquivo no R2, valida a **assinatura binária (Magic Bytes)**, extrai dimensões, remove metadados EXIF e altera o status para `approved`.

---

## 4. Condições Mínimas de Publicação no Marketplace

Um produto somente transiciona para `isPublished = true` se cumprir todas as regras abaixo:
1. Loja vinculada está ativa (`Store.status == "active"`).
2. Produto marcado como ativo (`Product.status == "active"`).
3. Categoria vinculada é válida e ativa.
4. Possui pelo menos 1 variação ativa com SKU válido e preço de venda > 0.
5. Possui pelo menos 1 imagem principal aprovada no R2.

---

## 5. Permissões Exigidas (`@verttex/auth`)

- `products.read` (`read:Product`)
- `products.create` (`create:Product`)
- `products.update` (`update:Product`)
- `products.archive` (`archive:Product`)
- `products.publish` (`publish:Product`)
- `products.manage-media` (`manage-media:Product`)
- `products.manage-price` (`manage-price:Product`)
