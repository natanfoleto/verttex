-- AlterTable
ALTER TABLE "personalization_profiles"
  ADD CONSTRAINT "personalization_profiles_xor_identity_check"
  CHECK (
    ("customer_id" IS NOT NULL AND "visitor_key_hash" IS NULL) OR
    ("customer_id" IS NULL AND "visitor_key_hash" IS NOT NULL)
  );
