import { prisma } from "../src/infrastructure/database/prisma";
import { randomUUID } from "crypto";

async function main() {
  const variations = await prisma.productVariation.findMany({
    include: { product: true },
  });

  let count = 0;
  for (const v of variations) {
    await prisma.productVariation.update({
      where: { id: v.id },
      data: {
        storeId: v.storeId || v.product.storeId,
        publicId: v.publicId || randomUUID(),
      },
    });
    count++;
  }
  console.log(`✅ Populated storeId and publicId for ${count} product variations successfully.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
