-- CreateEnum
CREATE TYPE "ChargeBilling" AS ENUM ('ARRIVAL_NOTICE', 'CUSTOMS_SETTLEMENT');

-- AlterTable
ALTER TABLE "ChargeConcept" ADD COLUMN     "billedIn" "ChargeBilling";

-- AlterTable
ALTER TABLE "ShipmentCharge" ADD COLUMN     "billedIn" "ChargeBilling";

