/*
  Warnings:

  - You are about to drop the column `actorCustomerId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `actorUserId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `entity` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "actorCustomerId",
DROP COLUMN "actorUserId",
DROP COLUMN "metadata",
DROP COLUMN "subject",
DROP COLUMN "subjectId",
ADD COLUMN     "entity" TEXT NOT NULL,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "newValues" JSONB,
ADD COLUMN     "oldValues" JSONB,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
