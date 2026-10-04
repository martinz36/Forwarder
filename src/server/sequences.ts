import type { Db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Db | Prisma.TransactionClient;

/** Siguiente correlativo de forma atómica (sin huecos por lecturas concurrentes). */
export async function nextSequence(db: Tx, organizationId: string, key: string): Promise<number> {
  const row = await db.numberSequence.upsert({
    where: { organizationId_key: { organizationId, key } },
    create: { organizationId, key, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
    select: { lastValue: true },
  });
  return row.lastValue;
}

/** Sube el correlativo hasta `value` si está por debajo (usado al importar datos existentes). */
export async function bumpSequence(db: Tx, organizationId: string, key: string, value: number): Promise<void> {
  const current = await db.numberSequence.findUnique({ where: { organizationId_key: { organizationId, key } } });
  if (!current) {
    await db.numberSequence.create({ data: { organizationId, key, lastValue: value } });
  } else if (current.lastValue < value) {
    await db.numberSequence.update({
      where: { organizationId_key: { organizationId, key } },
      data: { lastValue: value },
    });
  }
}

const pad = (n: number, width = 4) => String(n).padStart(width, "0");

export const sequenceKeys = {
  quote: (year: number) => `QUOTE:${year}`,
  // Un solo correlativo por año para todos los modos (L-2026-0003, M-2026-0004…), como en el sistema anterior.
  shipment: (year: number) => `SHIPMENT:${year}`,
  invoice: (series: string) => `INVOICE:${series}`,
};

export const formatQuoteNumber = (year: number, seq: number) => `COT-${year}-${pad(seq)}`;
export const formatShipmentNumber = (prefix: string, year: number, seq: number) => `${prefix}-${year}-${pad(seq)}`;

export function shipmentPrefix(mode: "SEA_FCL" | "SEA_LCL" | "AIR" | "ROAD"): string {
  if (mode === "SEA_LCL") return "L";
  if (mode === "AIR") return "A";
  if (mode === "ROAD") return "T";
  return "M";
}

export async function nextQuoteNumber(db: Tx, organizationId: string, date = new Date()): Promise<string> {
  const year = date.getFullYear();
  return formatQuoteNumber(year, await nextSequence(db, organizationId, sequenceKeys.quote(year)));
}

export async function nextShipmentNumber(
  db: Tx,
  organizationId: string,
  mode: Parameters<typeof shipmentPrefix>[0],
  date = new Date(),
): Promise<string> {
  const year = date.getFullYear();
  const prefix = shipmentPrefix(mode);
  return formatShipmentNumber(prefix, year, await nextSequence(db, organizationId, sequenceKeys.shipment(year)));
}
