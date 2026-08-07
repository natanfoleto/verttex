# Segurança de Upload de Arquivos — VERTTEX

> **Versão:** 1.1 — 2026-08-07
> **Status:** Implementado e recertificado localmente para imagens JPEG/PNG/WebP

---

## 1. Estado Atual

Existem fluxos multipart controlados e de URL pré-assinada sobre Cloudflare R2. Antes de aprovar um `File`, a API baixa o objeto com limite de streaming de 5 MB ou recebe o binário, decodifica-o com `sharp`, valida formato, MIME, tamanho e dimensões, reencoda a imagem sem metadados e persiste SHA-256 e dimensões. O conteúdo consolidado passou no Quality Gate em 2026-08-07.

> A topologia atual usa uma chave temporária no mesmo storage antes da normalização, e não dois buckets físicos separados. A separação por buckets descrita abaixo permanece como hardening futuro para produção.

---

## 2. Pipeline Obrigatório

```
Cliente
  ↓ URL pré-assinada ou endpoint controlado
  ↓ Bucket privado de QUARENTENA (nunca público)
  ↓ Validação de tamanho (antes e durante processamento)
  ↓ Validação de extensão (allowlist)
  ↓ Validação de magic bytes (assinatura real do arquivo)
  ↓ Decodificação completa com parser real
  ↓ Validação de dimensões (imagens)
  ↓ Proteção contra decompression bomb
  ↓ Remoção de EXIF e metadados
  ↓ Re-renderização/re-encode (gerar novo arquivo)
  ↓ Geração de nome UUID (nunca usar nome original)
  ↓ Bucket de ARQUIVOS PROCESSADOS (acesso controlado)
  ↓ Publicação controlada (URL pré-assinada com TTL curto)
```

---

## 3. Tipos de Arquivo Permitidos (Inicialmente)

Para imagens de produto e avatar:

| Tipo | MIME         | Magic Bytes                   |
| :--- | :----------- | :---------------------------- |
| JPEG | `image/jpeg` | `FF D8 FF`                    |
| PNG  | `image/png`  | `89 50 4E 47 0D 0A 1A 0A`     |
| WebP | `image/webp` | `52 49 46 46 ... 57 45 42 50` |

**Bloqueados inicialmente:** SVG, HTML, XML, ZIP, executáveis, scripts, PDF, documentos Office, formatos não documentados.

Novos formatos somente após análise de ameaça documentada e testes.

---

## 4. Limites

| Tipo              | Limite de Tamanho | Pixels máx | Por usuário/dia |
| :---------------- | :---------------- | :--------- | :-------------- |
| Avatar            | 5 MB              | 25 MP      | 10 uploads      |
| Imagem de produto | 5 MB              | 25 MP      | 100 uploads     |

---

## 5. Cloudflare R2 — Requisitos

- Buckets privados por padrão — sem acesso público
- Bucket separado: quarentena (nunca público) e arquivos processados
- Credenciais com escopo mínimo (apenas o bucket necessário)
- URLs pré-assinadas: TTL curto (15 min para upload, 1 hora para visualização)
- Sem listagem pública
- Não usar `r2.dev` em produção
- CORS restritivo: apenas origins autorizadas

---

## 6. Regras Obrigatórias

- Verificar autorização antes de associar arquivo a qualquer recurso
- Nunca usar nome original do arquivo como object key (usar UUID)
- Armazenar nome original apenas como metadado sanitizado, quando necessário
- Tratar URL pré-assinada como token de portador — tempo de vida curto
- Nunca expor ao uploader dados sobre quem visualizou o arquivo (anti-tracking)
- Registrar upload, processamento e associação no audit log

---

## 7. Não Permitido

- SVG remoto em imagens de usuário
- URLs remotas arbitrárias para avatar (baixar, validar e re-encodar se necessário)
- Exibir conteúdo do arquivo original sem processamento
- Associar arquivo a recurso de outro tenant/loja
