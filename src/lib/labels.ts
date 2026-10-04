import type {
  ChargeBasis,
  ChargeGroup,
  DocumentStatus,
  DocumentVisibility,
  EquipmentType,
  MemberRole,
  QuoteStatus,
  ServiceMode,
  ShipmentStatus,
  TaxTreatment,
} from "@/generated/prisma/enums";

export type Tone = "neutral" | "ok" | "warn" | "bad" | "info";

export const QUOTE_STATUS: Record<QuoteStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  SENT: { label: "Enviada", tone: "info" },
  ACCEPTED: { label: "Aceptada", tone: "ok" },
  REJECTED: { label: "Rechazada", tone: "bad" },
  EXPIRED: { label: "Vencida", tone: "warn" },
  CANCELLED: { label: "Anulada", tone: "neutral" },
};

export const SHIPMENT_STATUS: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  QUOTING: { label: "En cotización", tone: "warn" },
  CONFIRMED: { label: "Orden confirmada", tone: "info" },
  AT_ORIGIN: { label: "En origen", tone: "info" },
  IN_TRANSIT: { label: "En tránsito", tone: "info" },
  AT_DESTINATION: { label: "En destino", tone: "info" },
  CUSTOMS_CLEARANCE: { label: "En despacho", tone: "warn" },
  RELEASED: { label: "Levante", tone: "ok" },
  OUT_FOR_DELIVERY: { label: "En reparto", tone: "info" },
  DELIVERED: { label: "Entregado", tone: "ok" },
  CLOSED: { label: "Cerrado", tone: "neutral" },
  LOST: { label: "No concretado", tone: "neutral" },
  CANCELLED: { label: "Anulado", tone: "bad" },
};

export const MODE: Record<ServiceMode, string> = {
  SEA_LCL: "Marítimo LCL",
  SEA_FCL: "Marítimo FCL",
  AIR: "Aéreo",
  ROAD: "Terrestre",
};

export const DIRECTION = { IMPORT: "Importación", EXPORT: "Exportación" } as const;

/** Orden y nombre de las secciones de una cotización. */
export const GROUPS: { group: ChargeGroup; label: string }[] = [
  { group: "ORIGIN", label: "Origen" },
  { group: "FREIGHT", label: "Flete internacional" },
  { group: "INSURANCE", label: "Seguro" },
  { group: "DESTINATION", label: "Gastos en destino" },
  { group: "CUSTOMS", label: "Aduanas" },
  { group: "STORAGE", label: "Almacén" },
  { group: "INLAND_TRANSPORT", label: "Transporte local" },
  { group: "DUTIES_TAXES", label: "Derechos e impuestos" },
  { group: "OTHER", label: "Otros" },
];

export const TAX: Record<TaxTreatment, string> = {
  TAXED: "Afecto IGV",
  EXEMPT: "Exonerado",
  UNAFFECTED: "Inafecto",
  REIMBURSABLE: "Reembolso",
};

export const BASIS: Record<ChargeBasis, string> = {
  PER_SHIPMENT: "por embarque",
  PER_DOCUMENT: "por BL",
  PER_CONTAINER: "por contenedor",
  PER_WM: "por W/M",
  PER_CBM: "por m³",
  PER_TON: "por tonelada",
  PER_KG: "por kg",
  PER_CHARGEABLE_KG: "por kg cobrable",
  PER_PACKAGE: "por bulto",
  PER_DAY: "por día",
  PERCENT_FOB: "% FOB",
  PERCENT_CIF: "% CIF",
  MANUAL: "",
};

export const EQUIPMENT: Record<EquipmentType, string> = {
  DRY_20: "20' DRY",
  DRY_40: "40' DRY",
  HIGH_CUBE_40: "40' HC",
  HIGH_CUBE_45: "45' HC",
  REEFER_20: "20' RF",
  REEFER_40: "40' RF",
  OPEN_TOP_20: "20' OT",
  OPEN_TOP_40: "40' OT",
  FLAT_RACK_20: "20' FR",
  FLAT_RACK_40: "40' FR",
};

export const DOC_VISIBILITY: Record<DocumentVisibility, string> = { INTERNAL: "Interno", CLIENT: "Visible al cliente" };

export const DOC_STATUS: Record<DocumentStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  PENDING_CLIENT_APPROVAL: { label: "Por aprobar", tone: "warn" },
  CHANGES_REQUESTED: { label: "Con observaciones", tone: "bad" },
  FINAL: { label: "Final", tone: "ok" },
  VOID: { label: "Anulado", tone: "neutral" },
};

export const ROLE: Record<MemberRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  OPERATIONS: "Operaciones",
  SALES: "Comercial",
  ACCOUNTING: "Contabilidad",
  VIEWER: "Consulta",
};
