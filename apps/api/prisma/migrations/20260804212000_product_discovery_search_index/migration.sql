-- 1. Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Create IMMUTABLE unaccent wrapper function for GIN index compatibility
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
  RETURNS text AS
$func$
SELECT public.unaccent($1)
$func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- 3. Add pre-calculated search_vector column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 4. Create GIN index directly on search_vector column
CREATE INDEX IF NOT EXISTS products_search_vector_gin_idx 
ON products USING gin(search_vector);

-- 5. Create functional indexes for fast case-insensitive SKU and Barcode lookup
CREATE INDEX IF NOT EXISTS product_variations_lower_sku_idx 
ON product_variations(LOWER(sku));

CREATE INDEX IF NOT EXISTS product_variations_lower_barcode_idx 
ON product_variations(LOWER(barcode));

-- 6. Create composite index for published active products
CREATE INDEX IF NOT EXISTS products_status_published_idx 
ON products(status, "isPublished", "deletedAt");

-- 7. Helper function to compute weighted search vector for a product
CREATE OR REPLACE FUNCTION public.build_product_search_vector(p_product_id text)
RETURNS tsvector AS $body$
DECLARE
  v_name text;
  v_short_desc text;
  v_cat_name text;
  v_brand_name text;
  v_store_name text;
  v_attr_text text;
  v_res tsvector;
BEGIN
  SELECT p.name, p."shortDescription", c.name, b.name, s.name
  INTO v_name, v_short_desc, v_cat_name, v_brand_name, v_store_name
  FROM products p
  LEFT JOIN categories c ON c.id = p."categoryId"
  LEFT JOIN brands b ON b.id = p."brandId"
  LEFT JOIN stores s ON s.id = p."storeId"
  WHERE p.id = p_product_id;

  SELECT string_agg(DISTINCT ov.value, ' ')
  INTO v_attr_text
  FROM product_variations pv
  JOIN product_variation_values pvv ON pvv."variationId" = pv.id
  JOIN product_option_values ov ON ov.id = pvv."optionValueId"
  WHERE pv."productId" = p_product_id AND pv.status = 'active' AND pv."deletedAt" IS NULL;

  v_res := 
    setweight(to_tsvector('portuguese', f_unaccent(COALESCE(v_name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', f_unaccent(COALESCE(v_cat_name, ''))), 'B') ||
    setweight(to_tsvector('portuguese', f_unaccent(COALESCE(v_brand_name, ''))), 'B') ||
    setweight(to_tsvector('portuguese', f_unaccent(COALESCE(v_store_name, ''))), 'B') ||
    setweight(to_tsvector('portuguese', f_unaccent(COALESCE(v_attr_text, ''))), 'C') ||
    setweight(to_tsvector('portuguese', f_unaccent(COALESCE(v_short_desc, ''))), 'D');

  RETURN v_res;
END;
$body$ LANGUAGE plpgsql STABLE;

-- 8. Helper function to refresh product search vector
CREATE OR REPLACE FUNCTION public.refresh_product_search_vector(p_product_id text)
RETURNS void AS $body$
BEGIN
  UPDATE products 
  SET search_vector = public.build_product_search_vector(p_product_id)
  WHERE id = p_product_id;
END;
$body$ LANGUAGE plpgsql;

-- 9. Backfill all existing products in migration
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM products LOOP
    PERFORM public.refresh_product_search_vector(rec.id);
  END LOOP;
END $$;
