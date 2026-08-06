-- CreateIndex
CREATE UNIQUE INDEX "carts_unique_active_customer_id" ON "carts" ("customerId") WHERE "status" = 'active' AND "customerId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "carts_unique_active_session_id" ON "carts" ("sessionId") WHERE "status" = 'active' AND "sessionId" IS NOT NULL;
