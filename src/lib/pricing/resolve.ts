import Decimal from "decimal.js";
import type {
  ChargeBasis,
  ChargeGroup,
  Currency,
  Direction,
  EquipmentType,
  RateCardStatus,
  ServiceMode,
  TaxTreatment,
} from "@/generated/prisma/enums";
import { computeQuantity, dec, lineAmount, round2, round3, type CargoMetrics, type DecimalInput } from "./quantity";

/** Línea de tarifario junto con los datos de su tarifario. */
export interface RateCandidate {
  id: string;
  conceptId: string;
  card: {
    id: string;
    clientId: string | null;
    partnerId: string | null;
    direction: Direction | null;
    mode: ServiceMode | null;
    validFrom: Date | null;
    validTo: Date | null;
    status: RateCardStatus;
  };
  originId: string | null;
  destinationId: string | null;
  carrierId: string | null;
  equipment: EquipmentType | null;
  fromQuantity: DecimalInput;
  toQuantity: DecimalInput;
  basis: ChargeBasis;
  currency: Currency;
  cost: DecimalInput;
  price: DecimalInput;
  minQuantity: DecimalInput;
  minCost: DecimalInput;
  minPrice: DecimalInput;
}

export interface QuoteContext {
  clientId: string;
  direction: Direction;
  mode: ServiceMode;
  originId?: string | null;
  destinationId?: string | null;
  carrierId?: string | null;
  incoterm?: string | null;
  date: Date;
  cargo: CargoMetrics;
}

function applies(c: RateCandidate, ctx: QuoteContext): boolean {
  const { card } = c;
  if (card.status !== "ACTIVE") return false;
  if (card.validFrom && ctx.date < card.validFrom) return false;
  if (card.validTo && ctx.date > card.validTo) return false;
  if (card.clientId && card.clientId !== ctx.clientId) return false;
  if (card.direction && card.direction !== ctx.direction) return false;
  if (card.mode && card.mode !== ctx.mode) return false;
  if (c.originId && c.originId !== ctx.originId) return false;
  if (c.destinationId && c.destinationId !== ctx.destinationId) return false;
  if (c.carrierId && c.carrierId !== ctx.carrierId) return false;
  if (c.equipment && !(ctx.cargo.containers ?? []).some((k) => k.equipment === c.equipment && k.quantity > 0)) return false;

  const from = dec(c.fromQuantity);
  const to = dec(c.toQuantity);
  if (from || to) {
    const qty = computeQuantity(c.basis, ctx.cargo, { equipment: c.equipment });
    if (!qty) return false;
    if (from && qty.lessThan(from)) return false;
    if (to && qty.greaterThan(to)) return false;
  }
  return true;
}

/** Mientras más específica la tarifa, más puntaje. La tarifa del cliente siempre gana. */
function specificity(c: RateCandidate): number {
  return (
    (c.card.clientId ? 1000 : 0) +
    (c.originId ? 100 : 0) +
    (c.destinationId ? 100 : 0) +
    (c.carrierId ? 50 : 0) +
    (c.equipment ? 50 : 0) +
    (dec(c.fromQuantity) || dec(c.toQuantity) ? 10 : 0) +
    (c.card.mode ? 5 : 0) +
    (c.card.direction ? 5 : 0)
  );
}

function best(candidates: RateCandidate[]): RateCandidate | undefined {
  return [...candidates].sort(
    (a, b) =>
      specificity(b) - specificity(a) ||
      (b.card.validFrom?.getTime() ?? 0) - (a.card.validFrom?.getTime() ?? 0),
  )[0];
}

export interface RateResolution {
  sell?: RateCandidate;
  cost?: RateCandidate;
}

/** Elige la mejor tarifa de venta y la mejor de costo para un concepto. */
export function resolveRates(conceptId: string, candidates: RateCandidate[], ctx: QuoteContext): RateResolution {
  const valid = candidates.filter((c) => c.conceptId === conceptId && applies(c, ctx));
  const sell = best(valid.filter((c) => dec(c.price) !== null));
  // Para el costo se prefiere la tarifa del proveedor elegido (naviera) si existe.
  const costCandidates = valid.filter((c) => dec(c.cost) !== null);
  const fromCarrier = ctx.carrierId ? costCandidates.filter((c) => c.card.partnerId === ctx.carrierId) : [];
  const cost = best(fromCarrier.length ? fromCarrier : costCandidates);
  return { sell, cost };
}

export interface ConceptDefaults {
  id: string;
  name: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  defaultBasis: ChargeBasis;
  defaultCurrency: Currency;
  defaultCost: DecimalInput;
  defaultPrice: DecimalInput;
  defaultMinPrice: DecimalInput;
}

export interface TemplateLineInput {
  concept: ConceptDefaults;
  basis?: ChargeBasis | null;
  quantity?: DecimalInput;
  isOptional?: boolean;
  /** La línea solo aplica con estos incoterms (vacío = siempre). */
  incoterms?: string[];
  sortOrder?: number;
}

/** Líneas de plantilla que aplican al incoterm elegido. Sin incoterm se muestran todas. */
export function linesForIncoterm<T extends { incoterms?: string[] }>(lines: T[], incoterm?: string | null): T[] {
  if (!incoterm) return lines;
  return lines.filter((l) => !l.incoterms?.length || l.incoterms.includes(incoterm.toUpperCase()));
}

export interface DraftQuoteLine {
  conceptId: string;
  rateCardLineId: string | null;
  description: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  basis: ChargeBasis;
  quantity: string;
  currency: Currency;
  unitCost: string;
  unitPrice: string;
  minPrice: string | null;
  totalCost: string;
  totalPrice: string;
  isOptional: boolean;
  sortOrder: number;
  /** Avisos para quien cotiza (falta dato de carga, costo en otra moneda, etc.). */
  warnings: string[];
  priceSource: "client_rate" | "rate" | "concept" | "markup" | "none";
}

/**
 * Arma las líneas de una cotización a partir de una plantilla: busca la tarifa,
 * calcula la cantidad con los datos de la carga y aplica mínimos.
 */
export function buildQuoteLines(
  templateLines: TemplateLineInput[],
  candidates: RateCandidate[],
  ctx: QuoteContext,
  markupPct: DecimalInput,
): DraftQuoteLine[] {
  const markup = (dec(markupPct) ?? new Decimal(0)).div(100).plus(1);

  return linesForIncoterm(templateLines, ctx.incoterm).map((tl, index) => {
    const { concept } = tl;
    const warnings: string[] = [];
    const { sell, cost } = resolveRates(concept.id, candidates, ctx);

    const basis = sell?.basis ?? tl.basis ?? concept.defaultBasis;
    const currency = sell?.currency ?? concept.defaultCurrency;

    let quantity = dec(tl.quantity) ?? computeQuantity(basis, ctx.cargo, { equipment: sell?.equipment });
    if (!quantity) {
      quantity = new Decimal(1);
      if (basis !== "PER_SHIPMENT") warnings.push("Faltan datos de la carga para calcular la cantidad.");
    }
    const minQuantity = sell?.minQuantity;
    if (dec(minQuantity) && quantity.lessThan(dec(minQuantity)!)) quantity = dec(minQuantity)!;

    // Costo: con su propia unidad de cobro; se expresa por unidad de la línea de venta.
    let totalCost = new Decimal(0);
    if (cost && cost.currency === currency) {
      const costQty = cost.basis === basis ? quantity : computeQuantity(cost.basis, ctx.cargo, { equipment: cost.equipment });
      if (costQty) totalCost = lineAmount({ quantity: costQty, unitAmount: cost.cost, minQuantity: cost.minQuantity, minAmount: cost.minCost });
      else warnings.push("No se pudo calcular el costo con los datos de la carga.");
    } else if (cost) {
      warnings.push(`El costo está en ${cost.currency} y el precio en ${currency}.`);
    } else if (dec(concept.defaultCost) && concept.defaultCurrency === currency) {
      totalCost = lineAmount({ quantity, unitAmount: concept.defaultCost });
    }

    let unitPrice: Decimal;
    let minPrice = dec(sell?.minPrice) ?? null;
    let priceSource: DraftQuoteLine["priceSource"];
    if (sell) {
      unitPrice = dec(sell.price)!;
      priceSource = sell.card.clientId ? "client_rate" : "rate";
    } else if (dec(concept.defaultPrice)) {
      unitPrice = dec(concept.defaultPrice)!;
      minPrice = dec(concept.defaultMinPrice);
      priceSource = "concept";
    } else if (totalCost.greaterThan(0)) {
      unitPrice = totalCost.mul(markup).div(quantity).toDecimalPlaces(4);
      priceSource = "markup";
    } else {
      unitPrice = new Decimal(0);
      priceSource = "none";
      warnings.push("Sin tarifa: ingresa el precio.");
    }

    const totalPrice = lineAmount({ quantity, unitAmount: unitPrice, minAmount: minPrice });
    const unitCost = quantity.isZero() ? new Decimal(0) : totalCost.div(quantity).toDecimalPlaces(4);

    return {
      conceptId: concept.id,
      rateCardLineId: sell?.id ?? null,
      description: concept.name,
      group: concept.group,
      taxTreatment: concept.taxTreatment,
      basis,
      quantity: round3(quantity).toString(),
      currency,
      unitCost: unitCost.toString(),
      unitPrice: unitPrice.toString(),
      minPrice: minPrice ? round2(minPrice).toFixed(2) : null,
      totalCost: round2(totalCost).toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      isOptional: tl.isOptional ?? false,
      sortOrder: tl.sortOrder ?? index,
      warnings,
      priceSource,
    };
  });
}
