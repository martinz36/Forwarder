-- El expediente nace con la solicitud del cliente (QUOTING) y puede terminar sin concretarse (LOST).
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'QUOTING' BEFORE 'CONFIRMED';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'LOST' BEFORE 'CANCELLED';

-- Hitos de la etapa comercial vs. operativos
CREATE TYPE "MilestonePhase" AS ENUM ('QUOTING', 'OPERATION');
ALTER TABLE "MilestoneDefinition" ADD COLUMN "phase" "MilestonePhase" NOT NULL DEFAULT 'OPERATION';
