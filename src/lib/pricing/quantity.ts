import Decimal from "decimal.js";
import type { ChargeBasis, EquipmentType } from "@/generated/prisma/enums";

export type DecimalInput = Decimal.Value | { toString(): string } | null | undefined;

export function dec(value: DecimalInput): Decimal | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Decimal(typeof value === "object" && !(value instanceof Decimal) ? value.toString() : value);
  return d.isFinite() ? d : null;
}

export const round2 = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
export const round3 = (d: Decimal) => d.toDecimalPlaces(3, Decimal.ROUND_HALF_UP);

/** Datos de la carga con los que se calculan las cantidades. */
export interface CargoMetrics {
  grossWeightKg?: DecimalInput;
  volumeCbm?: DecimalInput;
  chargeableWeightKg?: DecimalInput;
  packages?: number | null;
  containers?: { equipment: EquipmentType; quantity: number }[];
  documents?: number | null; // N° de BL / AWB, por defecto 1
  days?: number | null; // para almacenajes
  fobValue?: DecimalInput;
  cifValue?: DecimalInput;
}

/** Factor volumétrico aéreo IATA: 1 m³ = 166.67 kg (6000 cm³/kg). */
export const AIR_VOLUMETRIC_KG_PER_CBM = new Decimal(1_000_000).div(6000);

export function chargeableWeightKg(cargo: CargoMetrics): Decimal | null {
  const explicit = dec(cargo.chargeableWeightKg);
  if (explicit) return explicit;
  const kg = dec(cargo.grossWeightKg);
  const cbm = dec(cargo.volumeCbm);
  if (!kg && !cbm) return null;
  const volumetric = cbm ? cbm.mul(AIR_VOLUMETRIC_KG_PER_CBM) : new Decimal(0);
  return round3(Decimal.max(kg ?? 0, volumetric));
}

/**
 * Cantidad que corresponde a una unidad de cobro. Devuelve null cuando faltan datos
 * (la línea queda para completar a mano).
 * Para porcentajes devuelve valor/100, de modo que cantidad × tarifa(%) = monto.
 */
export function computeQuantity(
  basis: ChargeBasis,
  cargo: CargoMetrics,
  options: { equipment?: EquipmentType | null } = {},
): Decimal | null {
  const kg = dec(cargo.grossWeightKg);
  const cbm = dec(cargo.volumeCbm);
  switch (basis) {
    case "PER_SHIPMENT":
      return new Decimal(1);
    case "PER_DOCUMENT":
      return new Decimal(cargo.documents ?? 1);
    case "PER_CONTAINER": {
      const list = cargo.containers ?? [];
      const relevant = options.equipment ? list.filter((c) => c.equipment === options.equipment) : list;
      const total = relevant.reduce((sum, c) => sum + c.quantity, 0);
      return total > 0 ? new Decimal(total) : null;
    }
    case "PER_WM":
      if (!kg && !cbm) return null;
      return round3(Decimal.max(kg ? kg.div(1000) : 0, cbm ?? 0));
    case "PER_CBM":
      return cbm ? round3(cbm) : null;
    case "PER_TON":
      return kg ? round3(kg.div(1000)) : null;
    case "PER_KG":
      return kg ? round3(kg) : null;
    case "PER_CHARGEABLE_KG":
      return chargeableWeightKg(cargo);
    case "PER_PACKAGE":
      return cargo.packages ? new Decimal(cargo.packages) : null;
    case "PER_DAY":
      return cargo.days ? new Decimal(cargo.days) : null;
    case "PERCENT_FOB": {
      const fob = dec(cargo.fobValue);
      return fob ? fob.div(100) : null;
    }
    case "PERCENT_CIF": {
      const cif = dec(cargo.cifValue);
      return cif ? cif.div(100) : null;
    }
    case "MANUAL":
      return null;
  }
}

/** Total de una línea aplicando cantidad mínima y monto mínimo. */
export function lineAmount(input: {
  quantity: DecimalInput;
  unitAmount: DecimalInput;
  minQuantity?: DecimalInput;
  minAmount?: DecimalInput;
}): Decimal {
  const minQty = dec(input.minQuantity);
  let qty = dec(input.quantity) ?? new Decimal(0);
  if (minQty && qty.lessThan(minQty)) qty = minQty;
  const amount = round2(qty.mul(dec(input.unitAmount) ?? 0));
  const minAmount = dec(input.minAmount);
  return minAmount && amount.lessThan(minAmount) ? round2(minAmount) : amount;
}
