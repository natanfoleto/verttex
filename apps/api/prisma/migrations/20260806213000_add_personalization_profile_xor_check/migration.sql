-- AlterTable
ALTER TABLE "personalization_profiles"
  ADD CONSTRAINT "personalization_profiles_xor_identity_check"
  CHECK (
    ("customerId" IS NOT NULL AND "visitorKeyHash" IS NULL) OR
    ("customerId" IS NULL AND "visitorKeyHash" IS NOT NULL)
  );
