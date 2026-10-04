// Listas para formularios (válidas en cliente y servidor).

export const INCOTERMS = ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"] as const;

export const EQUIPMENT_OPTIONS = [
  { value: "DRY_20", label: "20' DRY" },
  { value: "DRY_40", label: "40' DRY" },
  { value: "HIGH_CUBE_40", label: "40' HC" },
  { value: "REEFER_20", label: "20' RF" },
  { value: "REEFER_40", label: "40' RF" },
  { value: "OPEN_TOP_40", label: "40' OT" },
  { value: "FLAT_RACK_40", label: "40' FR" },
] as const;

export const TAX_ID_OPTIONS = [
  { value: "RUC", label: "RUC" },
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carné de extranjería" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "FOREIGN_TAX_ID", label: "ID fiscal extranjero" },
];

export const REGIME_OPTIONS = [
  { value: "IMPORT_FOR_CONSUMPTION", label: "10 · Importación para el consumo" },
  { value: "TEMPORARY_ADMISSION", label: "20/21 · Admisión temporal" },
  { value: "EXPORT_DEFINITIVE", label: "40 · Exportación definitiva" },
  { value: "TEMPORARY_EXPORT", label: "51/52 · Exportación temporal" },
  { value: "CUSTOMS_WAREHOUSE", label: "70 · Depósito aduanero" },
  { value: "TRANSIT", label: "80 · Tránsito" },
  { value: "OTHER", label: "Otro" },
];

export const CHANNEL_OPTIONS = [
  { value: "GREEN", label: "Verde" },
  { value: "ORANGE", label: "Naranja" },
  { value: "RED", label: "Rojo" },
];

/** "2026-10-04" en hora de Lima, para inputs type=date. */
export function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(value),
  );
}
