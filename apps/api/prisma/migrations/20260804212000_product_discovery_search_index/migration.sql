-- 1. Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Create IMMUTABLE unaccent wrapper function for GIN index compatibility
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
  RETURNS text AS
$func$
SELECT public.unaccent($1)
$func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- 3. Create GIN index on accent-insensitive portuguese tsvector
CREATE INDEX IF NOT EXISTS products_search_fts_gin_idx 
ON products USING gin(to_tsvector('portuguese', f_unaccent(COALESCE(name, '') || ' ' || COALESCE("shortDescription", ''))));

-- 4. Create functional indexes for fast case-insensitive SKU and Barcode lookup
CREATE INDEX IF NOT EXISTS product_variations_lower_sku_idx 
ON product_variations(LOWER(sku));

CREATE INDEX IF NOT EXISTS product_variations_lower_barcode_idx 
ON product_variations(LOWER(barcode));

-- 5. Create composite index for published active products
CREATE INDEX IF NOT EXISTS products_status_published_idx 
ON products(status, "isPublished", "deletedAt");
