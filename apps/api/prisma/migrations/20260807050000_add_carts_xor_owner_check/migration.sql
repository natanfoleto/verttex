-- Pre-check query to detect invalid legacy cart ownership records before adding constraint
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM "carts"
  WHERE ("customerId" IS NOT NULL AND "sessionId" IS NOT NULL)
     OR ("customerId" IS NULL AND "sessionId" IS NULL);

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: found % invalid cart ownership records violating XOR constraint (both customerId and sessionId filled or both NULL)', invalid_count;
  END IF;
END $$;

-- Add Check Constraint enforcing exactly one owner (customerId XOR sessionId) on carts table
ALTER TABLE "carts"
ADD CONSTRAINT "carts_xor_owner_check"
CHECK (("customerId" IS NOT NULL) <> ("sessionId" IS NOT NULL));
