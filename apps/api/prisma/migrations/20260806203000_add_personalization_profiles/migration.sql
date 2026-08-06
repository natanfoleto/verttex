-- CreateTable
CREATE TABLE "personalization_profiles" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "visitorKeyHash" TEXT,
    "personalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalization_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "personalization_profiles_customerId_key" ON "personalization_profiles"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "personalization_profiles_visitorKeyHash_key" ON "personalization_profiles"("visitorKeyHash");

-- CreateIndex
CREATE INDEX "personalization_profiles_visitorKeyHash_idx" ON "personalization_profiles"("visitorKeyHash");

-- CreateIndex
CREATE INDEX "personalization_profiles_customerId_idx" ON "personalization_profiles"("customerId");

-- AddForeignKey
ALTER TABLE "personalization_profiles" ADD CONSTRAINT "personalization_profiles_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
