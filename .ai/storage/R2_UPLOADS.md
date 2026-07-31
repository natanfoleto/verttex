# Padronização de Uploads e Armazenamento em Objetos (Cloudflare R2)

> **Documento de Referência da Arquitetura de Storage**  
> **Localização:** `.ai/storage/R2_UPLOADS.md`  
> **Status:** Ativo / Obrigatório

---

## 1. Visão Geral e Princípios

Todo arquivo ou mídia enviado para a plataforma VERTTEX através do Cloudflare R2 MUST seguir uma taxonomia rigorosa baseada em **Domínio de Negócio** e **Propósito (`purpose`)**.

### Princípios Fundamentais:
1. **Sem Pastas Genéricas ou Ambiguidade**: É estritamente proibido utilizar uma finalidade genérica (`store_logo`, `product_image`) para arquivos de outros domínios (ex: favicons ou logos institucionais do Marketplace).
2. **Mapeamento Deterministico no Backend**: O serviço `UploadService` do backend mapeia cada valor do enum `UploadPurpose` para o seu diretório relativo correspondente no bucket R2.
3. **Imutabilidade e Chaves Não Adivinháveis**: Todos os arquivos armazenados usam sufixos alfanuméricos únicos (`uniqueId`) para evitar sobreescritas acidentais ou adivinhação de URLs.

---

## 2. Tabela Canônica de Propósitos (`UploadPurpose`) e Caminhos R2

| Domínio de Negócio | Valor do Enum (`purpose`) | Diretório no R2 (`objectKey`) | Descrição / Uso |
|---|---|---|---|
| **Marketplace** | `marketplace_logo` | `uploads/marketplace/logos/{id}.{ext}` | Logo institucional do Marketplace |
| **Marketplace** | `marketplace_favicon` | `uploads/marketplace/favicons/{id}.{ext}` | Favicon da aba do navegador do Marketplace |
| **Marketplace** | `marketplace_og_image` | `uploads/marketplace/og-images/{id}.{ext}` | Imagem para pré-visualização em redes sociais (OpenGraph) |
| **Marketplace** | `marketplace_banner` | `uploads/marketplace/banners/{id}.{ext}` | Banners do carrossel principal do Marketplace |
| **Lojas / Produtores** | `store_logo` | `uploads/stores/logos/{id}.{ext}` | Logo de uma loja ou produtor rural |
| **Lojas / Produtores** | `store_banner` | `uploads/stores/banners/{id}.{ext}` | Banner de capa do perfil de uma loja |
| **Catálogo** | `product_image` | `uploads/catalog/products/{id}.{ext}` | Fotos e galeria de produtos |
| **Catálogo** | `category_icon` | `uploads/catalog/categories/{id}.{ext}` | Ícones e ilustrações de categorias de produtos |
| **Catálogo** | `brand_logo` | `uploads/catalog/brands/{id}.{ext}` | Logotipos das marcas de produtos |
| **Usuários** | `user_avatar` | `uploads/users/avatars/{id}.{ext}` | Foto de perfil do usuário |

---

## 3. Regras para Desenvolvedores e Agentes de IA

### No Frontend (Manager & Marketplace):
- Ao chamar a função de upload/presigned URL, especifique **sempre** o `purpose` correto referente à imagem enviada:
  - Logo do Marketplace → `purpose: "marketplace_logo"`
  - Favicon do Marketplace → `purpose: "marketplace_favicon"`
  - OG Image do Marketplace → `purpose: "marketplace_og_image"`
  - Banners do Carrossel → `purpose: "marketplace_banner"`
  - Logo da Loja → `purpose: "store_logo"`
  - Banner da Loja → `purpose: "store_banner"`
  - Foto de Produto → `purpose: "product_image"`

### No Backend (Fastify API):
- O enum `UploadPurpose` no Zod e o validador do controller devem incluir explicitamente todos os valores listados na seção 2.
- O `UploadService` deve utilizar o mapa estático `PURPOSE_FOLDER_MAP` para compor o `objectKey`:
  ```ts
  const folder = PURPOSE_FOLDER_MAP[purpose] || "uncategorized";
  const objectKey = `uploads/${folder}/${uniqueId}.${extension}`;
  ```

---

## 4. Segurança e Validação de Mídia
- **Formatos Permitidos**: Apenas `JPEG`, `PNG` e `WebP`.
- **Tamanho Máximo**: 5 MB por arquivo.
- **Validação MIME**: Verificada via Content-Type e sufixo de extensão seguro.
