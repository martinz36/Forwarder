import type {
  ChargeGroup,
  CustomsChannel,
  Direction,
  EquipmentType,
  PartnerType,
  ServiceMode,
  ShipmentStatus,
  TaxIdType,
} from "../../src/generated/prisma/enums";

// Conversión de los campos de texto libre del sistema anterior a datos estructurados.
// Lo que no se pueda interpretar se devuelve como null y el importador lo deja en notas.

const clean = (v: string | null | undefined) => (v ?? "").trim();

function parseNumber(raw: string): number | null {
  // "1,250.50" → 1250.5 ; "0,96" → 0.96
  const match = raw.match(/-?\d[\d.,]*/);
  if (!match) return null;
  let s = match[0];
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else if (s.includes(",")) s = /,\d{3}$/.test(s) && !/^0,/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** "960 KG" → 960 ; "0.96 Ton" → 960 ; "1.2 TM" → 1200 */
export function parseWeightKg(value: string | null | undefined): number | null {
  const raw = clean(value);
  if (!raw) return null;
  const n = parseNumber(raw);
  if (n === null) return null;
  if (/\b(t|tm|ton|tons|tonelada|toneladas)\b/i.test(raw)) return Math.round(n * 1000 * 1000) / 1000;
  return n;
}

/** "2.5 CBM" / "0.4 m3" / "67" → m³ */
export function parseVolumeCbm(value: string | null | undefined): number | null {
  const raw = clean(value);
  if (!raw) return null;
  return parseNumber(raw);
}

/** "3 PALETAS" → { packages: 3, packageType: "PALETAS" } */
export function parsePackages(value: string | null | undefined): { packages: number | null; packageType: string | null } {
  const raw = clean(value);
  if (!raw) return { packages: null, packageType: null };
  const match = raw.match(/^(\d+)\s*(.*)$/);
  if (!match) return { packages: null, packageType: raw };
  return { packages: Number(match[1]), packageType: clean(match[2]) || null };
}

const EQUIPMENT_PATTERNS: [RegExp, EquipmentType][] = [
  [/45\s*'?\s*(hc|hq)/i, "HIGH_CUBE_45"],
  [/40\s*'?\s*(hc|hq|high)/i, "HIGH_CUBE_40"],
  [/40\s*'?\s*(rf|rh|reefer)/i, "REEFER_40"],
  [/20\s*'?\s*(rf|reefer)/i, "REEFER_20"],
  [/40\s*'?\s*(ot|open)/i, "OPEN_TOP_40"],
  [/20\s*'?\s*(ot|open)/i, "OPEN_TOP_20"],
  [/40\s*'?\s*(fr|flat)/i, "FLAT_RACK_40"],
  [/20\s*'?\s*(fr|flat)/i, "FLAT_RACK_20"],
  [/40/, "DRY_40"],
  [/20/, "DRY_20"],
];

/** "0 X LCL", "LCL", "0" → carga suelta, no hay contenedores que registrar. */
export function isNoContainers(value: string | null | undefined): boolean {
  const raw = clean(value);
  return !raw || /\bLCL\b/i.test(raw) || /^0+(\s*[x×*].*)?$/i.test(raw);
}

/** "1x40HC" / "2 X 20'" / "1 x 40 HC + 1 x 20" → lista de equipos. null si no se entiende. */
export function parseContainers(value: string | null | undefined): { equipment: EquipmentType; quantity: number }[] | null {
  const raw = clean(value);
  if (!raw) return null;
  const parts = raw.split(/[+,;/]| y /i).map((p) => p.trim()).filter(Boolean);
  const result: { equipment: EquipmentType; quantity: number }[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*[x×*]\s*(.+)$/i) ?? part.match(/^()(.+)$/);
    if (!m) return null;
    const quantity = m[1] ? Number(m[1]) : 1;
    const spec = m[2] ?? "";
    const found = EQUIPMENT_PATTERNS.find(([re]) => re.test(spec));
    if (!found) return null;
    result.push({ equipment: found[1], quantity });
  }
  return result.length ? result : null;
}

/** "15/09/2026", "2026-10-20", "20-10-2026" → Date (UTC, mediodía para no cambiar de día). */
export function parseDate(value: string | null | undefined): Date | null {
  const raw = clean(value);
  if (!raw) return null;
  let y: number, m: number, d: number;
  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return date.getUTCDate() === d ? date : null;
}

/** Dirección y modo a partir de "IMPORTACIÓN MARÍTIMA", "LCL / LCL", "FCL", "1x40HC", "AIR"… */
export function parseServiceMode(input: {
  modality?: string | null;
  loadType?: string | null;
  containersCount?: string | null;
  transportMode?: string | null;
}): { direction: Direction; mode: ServiceMode } {
  const text = [input.modality, input.loadType, input.transportMode].map(clean).join(" ").toUpperCase();
  const plain = text.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const direction: Direction = /EXPORT/.test(plain) ? "EXPORT" : "IMPORT";
  let mode: ServiceMode;
  if (/AERE|AIR/.test(plain)) mode = "AIR";
  else if (/TERRESTRE|ROAD|CAMION/.test(plain)) mode = "ROAD";
  else if (/FCL/.test(plain) || parseContainers(input.containersCount)) mode = "SEA_FCL";
  else mode = "SEA_LCL";
  return { direction, mode };
}

export const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"] as const;

export function parseIncoterm(value: string | null | undefined): string | null {
  const m = clean(value).toUpperCase().match(new RegExp(`\\b(${INCOTERMS.join("|")})\\b`));
  return m?.[1] ?? null;
}

export function mapTaxIdType(value: string | null | undefined): TaxIdType {
  const v = clean(value).toUpperCase();
  if (v === "RUC" || v === "DNI" || v === "CE") return v;
  if (v.startsWith("PAS")) return "PASSPORT";
  return "OTHER";
}

export function mapCategory(value: string | null | undefined): ChargeGroup {
  switch (clean(value).toUpperCase()) {
    case "GASTOS_ORIGEN":
      return "ORIGIN";
    case "FLETE_INTERNACIONAL":
      return "FREIGHT";
    case "SEGURO":
      return "INSURANCE";
    case "GASTOS_LOCALES":
      return "DESTINATION";
    default:
      return "OTHER";
  }
}

export function mapPartnerType(value: string | null | undefined): PartnerType {
  const v = clean(value).toUpperCase();
  const known: PartnerType[] = ["CARRIER", "AIRLINE", "AGENT", "COLOADER", "WAREHOUSE", "TRUCKER", "CUSTOMS_BROKER", "INSURER", "SHIPPER", "CONSIGNEE"];
  return (known as string[]).includes(v) ? (v as PartnerType) : "OTHER";
}

export function mapOperationStatus(value: string | null | undefined): ShipmentStatus {
  switch (clean(value).toUpperCase()) {
    case "COORDINANDO_ORIGEN":
    case "POR_RECOGER":
      return "CONFIRMED"; // coordinando: la carga aún no se recoge
    case "EN_ALMACEN_ORIGEN":
      return "AT_ORIGIN";
    case "EN_TRANSITO":
      return "IN_TRANSIT";
    case "EN_ADUANA_DESTINO":
    case "EN_ADUANA":
      return "CUSTOMS_CLEARANCE";
    case "EN_REPARTO":
      return "OUT_FOR_DELIVERY";
    case "ENTREGADO":
    case "RETIRADO":
    // LIQUIDADO se marcaba al emitir una factura simulada: no implica cierre real.
    case "LIQUIDADO":
      return "DELIVERED";
    default:
      return "CONFIRMED";
  }
}

export function mapCustomsChannel(value: string | null | undefined): CustomsChannel | null {
  switch (clean(value).toUpperCase()) {
    case "VERDE":
      return "GREEN";
    case "NARANJA":
      return "ORANGE";
    case "ROJO":
      return "RED";
    default:
      return null;
  }
}

/** Documentos que el sistema anterior generaba de prueba (factura SUNAT simulada, recibo interno). */
export function isMockDocument(fileUrl: string): boolean {
  return fileUrl.startsWith("/") || fileUrl.includes("w3.org/W3C/DesignIssues");
}

const DOCUMENT_NAME_PATTERNS: [RegExp, string][] = [
  [/volante/i, "VOLANTE"],
  [/gu[ií]a de remisi[oó]n|cargo de entrega/i, "DELIVERY_GUIDE"],
  [/certificado de origen/i, "CERT_ORIGIN"],
  [/p[oó]liza|seguro/i, "INSURANCE_POLICY"],
  [/aviso de llegada/i, "ARRIVAL_NOTICE"],
  [/packing/i, "PACKING_LIST"],
  [/factura comercial|commercial invoice/i, "COMMERCIAL_INVOICE"],
  [/\b(dam|dua)\b|declaraci[oó]n aduanera/i, "DAM"],
  [/vuce|permiso|autorizaci[oó]n/i, "PERMITS"],
  [/ficha t[eé]cnica|cat[aá]logo/i, "TECH_SHEET"],
  [/pre-?alerta/i, "PREALERT"],
  [/\b(awb|hawb|gu[ií]a a[eé]rea)\b/i, "AWB"],
  [/constancia de pago|voucher|transferencia/i, "PAYMENT_PROOF"],
];

/** Tipo nuevo a partir del tipo anterior; los "OTRO" se reconocen por el nombre del archivo. */
export function mapDocumentTypeCode(value: string | null | undefined, name?: string | null): string {
  if (clean(value).toUpperCase() === "OTRO" && name) {
    const found = DOCUMENT_NAME_PATTERNS.find(([re]) => re.test(name));
    if (found) return found[1];
  }
  switch (clean(value).toUpperCase()) {
    case "BL":
      return "HBL";
    case "FACTURA_COMERCIAL":
      return "COMMERCIAL_INVOICE";
    case "PACKING_LIST":
      return "PACKING_LIST";
    case "DAM":
      return "DAM";
    case "LIQUIDACION":
      return "ISSUED_INVOICE";
    default:
      return "OTHER";
  }
}
