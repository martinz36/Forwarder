-- Separado del anterior: Postgres no deja usar un valor de enum en la misma transacción en que se crea.
ALTER TABLE "Shipment" ALTER COLUMN "status" SET DEFAULT 'QUOTING';
