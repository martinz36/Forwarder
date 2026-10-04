-- CreateEnum
CREATE TYPE "StatementType" AS ENUM ('ARRIVAL_NOTICE', 'CUSTOMS_SETTLEMENT', 'FINAL_SETTLEMENT', 'REIMBURSEMENT_RECEIPT');

-- CreateEnum
CREATE TYPE "StatementStatus" AS ENUM ('ISSUED', 'VOID');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "paymentInstructions" TEXT;

-- CreateTable
CREATE TABLE "Statement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "StatementType" NOT NULL,
    "number" TEXT NOT NULL,
    "status" "StatementStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "lines" JSONB NOT NULL,
    "totals" JSONB NOT NULL,
    "payments" JSONB,
    "balance" JSONB,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Statement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Statement_shipmentId_idx" ON "Statement"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Statement_organizationId_number_key" ON "Statement"("organizationId", "number");

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

