import type { QuoteStatus } from "@/generated/prisma/enums";
import { QUOTE_STATUS, type Tone } from "@/lib/labels";

/** Vencida = la fecha de validez ya pasó (antes de hoy). */
export function isExpired(validUntil: Date | string | null | undefined, now = new Date()): boolean {
  if (!validUntil) return false;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(validUntil) < startOfToday;
}

/** Estado que se muestra: una enviada sin respuesta y fuera de vigencia se ve como "Vencida". */
export function quoteDisplayStatus(status: QuoteStatus, validUntil: Date | null | undefined): { label: string; tone: Tone } {
  if (status === "SENT" && isExpired(validUntil)) return { label: "Vencida", tone: "warn" };
  return QUOTE_STATUS[status];
}
