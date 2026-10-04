import { test } from "node:test";
import assert from "node:assert/strict";
import { chargeStage, computeBalance } from "./billing";
import { computeTotals } from "../lib/pricing/totals";
import { describeLine } from "../lib/pricing/display";

test("origen, flete y destino van al aviso de llegada; el resto a la liquidación de aduanas", () => {
  assert.equal(chargeStage("FREIGHT"), "ARRIVAL_NOTICE");
  assert.equal(chargeStage("DESTINATION"), "ARRIVAL_NOTICE");
  assert.equal(chargeStage("CUSTOMS"), "CUSTOMS_SETTLEMENT");
  assert.equal(chargeStage("STORAGE"), "CUSTOMS_SETTLEMENT");
  assert.equal(chargeStage("INLAND_TRANSPORT"), "CUSTOMS_SETTLEMENT");
});

test("saldo por moneda: cargos con IGV menos depósitos", () => {
  const totals = computeTotals(
    [
      { currency: "USD", taxTreatment: "TAXED", totalPrice: 486.75 },
      { currency: "USD", taxTreatment: "REIMBURSABLE", totalPrice: 1436.3 },
      { currency: "PEN", taxTreatment: "TAXED", totalPrice: 850 },
    ],
    18,
  );
  const balance = computeBalance(totals, [{ currency: "USD", amount: "1322.10" }]);
  assert.deepEqual(balance, [
    { currency: "USD", charged: "2010.67", paid: "1322.10", balance: "688.57" },
    { currency: "PEN", charged: "1003.00", paid: "0.00", balance: "1003.00" },
  ]);
});

test("un depósito de más deja saldo a favor del cliente", () => {
  const totals = computeTotals([{ currency: "USD", taxTreatment: "REIMBURSABLE", totalPrice: 100 }], 18);
  assert.equal(computeBalance(totals, [{ currency: "USD", amount: 150 }])[0]?.balance, "-50.00");
});

test("porcentajes y opcionales sin precio se muestran legibles", () => {
  const pct = describeLine({ basis: "PERCENT_CIF", quantity: 185, unitPrice: 0.35, totalPrice: 64.75, currency: "USD" });
  assert.equal(pct.quantity, "valor CIF USD 18,500.00");
  assert.equal(pct.unitPrice, "0.35 %");
  const pending = describeLine({ basis: "PER_SHIPMENT", quantity: 1, unitPrice: 0, totalPrice: 0, currency: "USD", isOptional: true });
  assert.equal(pending.total, "Por confirmar");
});
