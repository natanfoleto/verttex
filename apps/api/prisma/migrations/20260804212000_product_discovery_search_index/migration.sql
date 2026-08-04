-- CreateTable
CREATE TABLE IF NOT EXISTS "product_search_documents" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "titleNormalized" TEXT NOT NULL,
    "contextNormalized" TEXT NOT NULL,
    "attributesNormalized" TEXT NOT NULL,
    "descriptionNormalized" TEXT NOT NULL,
    "searchTextNormalized" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_search_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_search_documents_productId_key" ON "product_search_documents"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_search_documents_productId_idx" ON "product_search_documents"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_search_documents_searchTextNormalized_idx" ON "product_search_documents"("searchTextNormalized");

-- AddForeignKey
ALTER TABLE "product_search_documents" ADD CONSTRAINT "product_search_documents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
