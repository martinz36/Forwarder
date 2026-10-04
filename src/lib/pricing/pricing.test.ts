import { test } from "node:test";
import assert from "node:assert/strict";
import { chargeableWeightKg, computeQuantity, lineAmount } from "./quantity";
import { computeTotals } from "./totals";
import { buildQuoteLines, resolveRates, type ConceptDefaults, type QuoteContext, type RateCandidate } from "./resolve";

test("W/M toma el mayor entre toneladas y m³", () => {
  assert.equal(computeQuantity("PER_WM", { grossWeightKg: 960, volumeCbm: 2.5 })?.toString(), "2.5");
  assert.equal(computeQuantity("PER_WM", { grossWeightKg: 3000, volumeCbm: 1.2 })?.toString(), "3");
  assert.equal(computeQuantity("PER_WM", {}), null);
});

test("peso cobrable aéreo usa el factor 1:6000", () => {
  assert.equal(chargeableWeightKg({ grossWeightKg: 85, volumeCbm: 0.4 })?.toString(), "85");
  assert.equal(chargeableWeightKg({ grossWeightKg: 50, volumeCbm: 1 })?.toString(), "166.667");
  assert.equal(chargeableWeightKg({ chargeableWeightKg: 120, grossWeightKg: 50 })?.toString(), "120");
});

test("por contenedor respeta el tipo de equipo", () => {
  const cargo = { containers: [{ equipment: "HIGH_CUBE_40" as const, quantity: 2 }, { equipment: "DRY_20" as const, quantity: 1 }] };
  assert.equal(computeQuantity("PER_CONTAINER", cargo)?.toString(), "3");
  assert.equal(computeQuantity("PER_CONTAINER", cargo, { equipment: "DRY_20" })?.toString(), "1");
  assert.equal(computeQuantity("PER_CONTAINER", {}), null);
});

test("mínimos de cantidad y de monto", () => {
  assert.equal(lineAmount({ quantity: 0.8, unitAmount: 45, minQuantity: 1 }).toFixed(2), "45.00");
  // 0.3% de un CIF de 20 000 = 60, con mínimo de 150
  const qty = computeQuantity("PERCENT_CIF", { cifValue: 20000 });
  assert.equal(lineAmount({ quantity: qty, unitAmount: 0.3, minAmount: 150 }).toFixed(2), "150.00");
  assert.equal(lineAmount({ quantity: computeQuantity("PERCENT_CIF", { cifValue: 100000 }), unitAmount: 0.3, minAmount: 150 }).toFixed(2), "300.00");
});

test("totales separados por moneda, IGV solo sobre lo gravado, opcionales fuera", () => {
  const totals = computeTotals(
    [
      { currency: "USD", taxTreatment: "TAXED", totalPrice: 150, totalCost: 120 },
      { currency: "USD", taxTreatment: "TAXED", totalPrice: 150.01, totalCost: 0 },
      { currency: "USD", taxTreatment: "REIMBURSABLE", totalPrice: 530, totalCost: 450 },
      { currency: "USD", taxTreatment: "REIMBURSABLE", totalPrice: 110, isOptional: true },
      { currency: "PEN", taxTreatment: "TAXED", totalPrice: 850, totalCost: 650 },
    ],
    18,
  );
  assert.deepEqual(totals.USD, {
    taxed: "300.01", exempt: "0.00", unaffected: "0.00", tax: "54.00", invoiceTotal: "354.01",
    reimbursable: "530.00", total: "884.01", cost: "570.00", margin: "260.01", optional: "110.00",
  });
  assert.equal(totals.PEN?.total, "1003.00");
  assert.equal(totals.PEN?.margin, "200.00");
});

const card = (over: Partial<RateCandidate["card"]> = {}): RateCandidate["card"] => ({
  id: "card", clientId: null, partnerId: null, direction: null, mode: null, validFrom: null, validTo: null, status: "ACTIVE", ...over,
});
const line = (over: Partial<RateCandidate>): RateCandidate => ({
  id: "x", conceptId: "freight", card: card(), originId: null, destinationId: null, carrierId: null, equipment: null,
  fromQuantity: null, toQuantity: null, basis: "PER_WM", currency: "USD", cost: null, price: null,
  minQuantity: null, minCost: null, minPrice: null, ...over,
});
const ctx: QuoteContext = {
  clientId: "andinas", direction: "IMPORT", mode: "SEA_LCL", originId: "CNSHA", destinationId: "PECLL", carrierId: "msc",
  date: new Date("2026-10-04"), cargo: { grossWeightKg: 960, volumeCbm: 2.5 },
};

test("la tarifa del cliente gana sobre la general y la de ruta", () => {
  const candidates = [
    line({ id: "general", price: 60 }),
    line({ id: "ruta", originId: "CNSHA", price: 55 }),
    line({ id: "cliente", card: card({ clientId: "andinas" }), price: 50 }),
    line({ id: "otro-cliente", card: card({ clientId: "otro" }), price: 10 }),
  ];
  assert.equal(resolveRates("freight", candidates, ctx).sell?.id, "cliente");
  assert.equal(resolveRates("freight", candidates.slice(0, 2), ctx).sell?.id, "ruta");
});

test("ignora tarifarios vencidos, archivados o de otro modo, y respeta tramos", () => {
  const candidates = [
    line({ id: "vencida", card: card({ validTo: new Date("2026-09-30") }), price: 1 }),
    line({ id: "archivada", card: card({ status: "ARCHIVED" }), price: 1 }),
    line({ id: "aereo", card: card({ mode: "AIR" }), price: 1 }),
    line({ id: "tramo-0-2", toQuantity: 2, price: 70 }),
    line({ id: "tramo-2-5", fromQuantity: 2, toQuantity: 5, price: 58 }),
  ];
  assert.equal(resolveRates("freight", candidates, ctx).sell?.id, "tramo-2-5");
});

test("el costo prefiere la tarifa de la naviera elegida", () => {
  const candidates = [
    line({ id: "costo-otro", card: card({ partnerId: "cosco" }), cost: 30 }),
    line({ id: "costo-msc", card: card({ partnerId: "msc" }), cost: 35 }),
  ];
  assert.equal(resolveRates("freight", candidates, ctx).cost?.id, "costo-msc");
});

test("arma la cotización desde la plantilla con tarifa, defaults y margen", () => {
  const concept = (over: Partial<ConceptDefaults>): ConceptDefaults => ({
    id: "c", name: "c", group: "DESTINATION", taxTreatment: "TAXED", defaultBasis: "PER_SHIPMENT",
    defaultCurrency: "USD", defaultCost: null, defaultPrice: null, defaultMinPrice: null, ...over,
  });
  const lines = buildQuoteLines(
    [
      { concept: concept({ id: "freight", name: "Flete marítimo LCL", group: "FREIGHT", taxTreatment: "REIMBURSABLE", defaultBasis: "PER_WM" }) },
      { concept: concept({ id: "vb", name: "Visto bueno", defaultPrice: 150, defaultCost: 120 }) },
      { concept: concept({ id: "handling", name: "Handling", defaultCost: 100 }) },
      { concept: concept({ id: "almacen", name: "Almacenaje", defaultBasis: "PER_DAY" }) },
    ],
    [line({ id: "r1", card: card({ clientId: "andinas" }), price: 50, cost: 40, minQuantity: 1 })],
    ctx,
    15,
  );
  const [freight, vb, handling, almacen] = lines;
  assert.deepEqual(
    { q: freight?.quantity, p: freight?.totalPrice, c: freight?.totalCost, s: freight?.priceSource },
    { q: "2.5", p: "125.00", c: "100.00", s: "client_rate" },
  );
  assert.equal(vb?.totalPrice, "150.00");
  assert.equal(vb?.priceSource, "concept");
  assert.equal(handling?.totalPrice, "115.00");
  assert.equal(handling?.priceSource, "markup");
  assert.equal(almacen?.priceSource, "none");
  assert.equal(almacen?.warnings.length, 2);
});

test("las líneas dependen del incoterm (EXW solo con EXW, flete solo si lo paga el importador)", async () => {
  const { linesForIncoterm } = await import("./resolve");
  const lines = [
    { code: "EXW", incoterms: ["EXW"] },
    { code: "FLETE", incoterms: ["EXW", "FCA", "FAS", "FOB"] },
    { code: "VB", incoterms: [] },
  ];
  assert.deepEqual(linesForIncoterm(lines, "exw").map((l) => l.code), ["EXW", "FLETE", "VB"]);
  assert.deepEqual(linesForIncoterm(lines, "FOB").map((l) => l.code), ["FLETE", "VB"]);
  assert.deepEqual(linesForIncoterm(lines, "CIF").map((l) => l.code), ["VB"]);
  assert.deepEqual(linesForIncoterm(lines, null).map((l) => l.code), ["EXW", "FLETE", "VB"]);
});
