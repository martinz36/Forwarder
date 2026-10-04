const TZ = "America/Lima";

type DecimalLike = number | string | { toString(): string } | null | undefined;

export function toNumber(value: DecimalLike): number {
  if (value === null || value === undefined) return 0;
  const n = Number(typeof value === "object" ? value.toString() : value);
  return Number.isFinite(n) ? n : 0;
}

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** "USD 1,586.99" / "S/ 850.00" */
export function formatMoney(value: DecimalLike, currency: string): string {
  let f = moneyFormatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    moneyFormatters.set(currency, f);
  }
  const symbol = currency === "PEN" ? "S/" : currency;
  return `${symbol} ${f.format(toNumber(value))}`;
}

export function formatQuantity(value: DecimalLike): string {
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(toNumber(value));
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ }).format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
}

export function formatWeight(kg: DecimalLike): string | null {
  if (kg === null || kg === undefined) return null;
  return `${formatQuantity(kg)} kg`;
}

export function formatVolume(cbm: DecimalLike): string | null {
  if (cbm === null || cbm === undefined) return null;
  return `${formatQuantity(cbm)} m³`;
}
