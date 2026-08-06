import { prisma } from "../src/infrastructure/database/prisma";

async function main() {
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "product_variations_publicId_key" ON "product_variations"("publicId");`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "product_variations_storeId_sku_key" ON "product_variations"("storeId", "sku");`,
  );
  console.log("✅ Created unique indexes in PostgreSQL successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
