import Decimal from "decimal.js";
import type { Currency, TaxTreatment } from "@/generated/prisma/enums";
import { dec, round2, type DecimalInput } from "./quantity";

export interface TotalsLine {
  currency: Currency;
  taxTreatment: TaxTreatment;
  totalPrice: DecimalInput;
  totalCost?: DecimalInput;
  isOptional?: boolean;
}

export interface CurrencyTotals {
  taxed: string;
  exempt: string;
  unaffected: string;
  tax: string; // IGV sobre lo gravado
  invoiceTotal: string; // lo que va en factura
  reimbursable: string; // lo que va en liquidación de reembolso
  total: string; // invoiceTotal + reimbursable
  cost: string;
  margin: string; // venta sin IGV − costo
  optional: string; // líneas opcionales, fuera del total
}

export type Totals = Partial<Record<Currency, CurrencyTotals>>;

/**
 * Totales por moneda (nunca se mezclan USD y PEN). El IGV se calcula una sola vez
 * sobre la suma gravada, redondeado a 2 decimales.
 */
export function computeTotals(lines: TotalsLine[], taxRatePct: DecimalInput): Totals {
  const rate = (dec(taxRatePct) ?? new Decimal(0)).div(100);
  const acc = new Map<Currency, Record<"taxed" | "exempt" | "unaffected" | "reimbursable" | "cost" | "optional", Decimal>>();

  for (const line of lines) {
    const bucket =
      acc.get(line.currency) ??
      { taxed: new Decimal(0), exempt: new Decimal(0), unaffected: new Decimal(0), reimbursable: new Decimal(0), cost: new Decimal(0), optional: new Decimal(0) };
    acc.set(line.currency, bucket);
    const price = dec(line.totalPrice) ?? new Decimal(0);
    if (line.isOptional) {
      bucket.optional = bucket.optional.plus(price);
      continue;
    }
    bucket.cost = bucket.cost.plus(dec(line.totalCost) ?? 0);
    const key = ({ TAXED: "taxed", EXEMPT: "exempt", UNAFFECTED: "unaffected", REIMBURSABLE: "reimbursable" } as const)[line.taxTreatment];
    bucket[key] = bucket[key].plus(price);
  }

  const result: Totals = {};
  for (const [currency, b] of acc) {
    const tax = round2(b.taxed.mul(rate));
    const invoiceTotal = round2(b.taxed.plus(b.exempt).plus(b.unaffected).plus(tax));
    const sales = b.taxed.plus(b.exempt).plus(b.unaffected).plus(b.reimbursable);
    result[currency] = {
      taxed: round2(b.taxed).toFixed(2),
      exempt: round2(b.exempt).toFixed(2),
      unaffected: round2(b.unaffected).toFixed(2),
      tax: tax.toFixed(2),
      invoiceTotal: invoiceTotal.toFixed(2),
      reimbursable: round2(b.reimbursable).toFixed(2),
      total: round2(invoiceTotal.plus(b.reimbursable)).toFixed(2),
      cost: round2(b.cost).toFixed(2),
      margin: round2(sales.minus(b.cost)).toFixed(2),
      optional: round2(b.optional).toFixed(2),
    };
  }
  return result;
}
