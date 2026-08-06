import { prisma } from "../src/infrastructure/database/prisma";

async function main() {
  const variations = await prisma.productVariation.findMany();
  console.log("Total variations:", variations.length);

  const publicIds = new Set();
  let pubIdDups = 0;
  for (const v of variations) {
    if (publicIds.has(v.publicId)) pubIdDups++;
    else publicIds.add(v.publicId);
  }

  const storeSkus = new Set();
  let storeSkuDups = 0;
  for (const v of variations) {
    const key = `${v.storeId}:${v.sku}`;
    if (storeSkus.has(key)) {
      console.log("Duplicate storeId + SKU found:", key, "ID:", v.id);
      storeSkuDups++;
    } else {
      storeSkus.add(key);
    }
  }

  console.log(
    `Public ID duplicates: ${pubIdDups}, Store+SKU duplicates: ${storeSkuDups}`,
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
