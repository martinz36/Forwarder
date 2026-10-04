import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPendings, type PendingInput } from "./pendings";

const now = new Date("2026-10-20T15:00:00-05:00");
const d = (s: string) => new Date(`${s}T12:00:00-05:00`);
const shipment = (over: Partial<PendingInput["shipments"][number]>): PendingInput["shipments"][number] => ({
  number: "L-2026-0001",
  status: "IN_TRANSIT",
  client: "Cliente",
  createdAt: d("2026-10-01"),
  includesFreight: true,
  mode: "SEA_LCL",
  eta: null,
  ata: null,
  freeDays: null,
  quotesCount: 1,
  channel: null,
  releasedAt: null,
  containersToReturn: 0,
  arrivalNotice: null,
  paymentsCount: 0,
  pendingClientDocs: [],
  balanceDue: [],
  ...over,
});
const kinds = (input: Partial<PendingInput>) =>
  buildPendings({ shipments: [], quotes: [], ...input }, now).map((p) => `${p.kind}${p.urgent ? "!" : ""}`);

test("llega en 5 días sin aviso de llegada; urgente si faltan 3 o menos", () => {
  assert.deepEqual(kinds({ shipments: [shipment({ eta: d("2026-10-25") })] }), ["arrival_notice_missing"]);
  assert.deepEqual(kinds({ shipments: [shipment({ eta: d("2026-10-22") })] }), ["arrival_notice_missing!"]);
  assert.deepEqual(kinds({ shipments: [shipment({ eta: d("2026-11-15") })] }), [], "lejos todavía");
  assert.deepEqual(kinds({ shipments: [shipment({ eta: d("2026-10-22"), arrivalNotice: { number: "AL", issuedAt: d("2026-10-20") } })] }), [], "ya emitido");
});

test("aviso emitido sin depósito después de 2 días", () => {
  const s = shipment({ arrivalNotice: { number: "AL-2026-0001", issuedAt: d("2026-10-17") } });
  assert.deepEqual(kinds({ shipments: [s] }), ["deposit_missing"]);
  assert.deepEqual(kinds({ shipments: [{ ...s, paymentsCount: 1 }] }), []);
});

test("canal rojo sin levante es urgente; con levante desaparece", () => {
  assert.deepEqual(kinds({ shipments: [shipment({ status: "CUSTOMS_CLEARANCE", channel: "RED" })] }), ["customs_inspection!"]);
  assert.deepEqual(kinds({ shipments: [shipment({ status: "CUSTOMS_CLEARANCE", channel: "RED", releasedAt: d("2026-10-19") })] }), []);
});

test("días libres de contenedor por vencer o vencidos", () => {
  const fcl = shipment({ status: "OUT_FOR_DELIVERY", mode: "SEA_FCL", ata: d("2026-10-10"), freeDays: 12, containersToReturn: 2 });
  assert.deepEqual(kinds({ shipments: [fcl] }), ["free_days"]);
  assert.deepEqual(kinds({ shipments: [{ ...fcl, freeDays: 9 }] }), ["free_days!"]);
  assert.deepEqual(kinds({ shipments: [{ ...fcl, containersToReturn: 0 }] }), []);
});

test("solicitud sin cotizar, cotizaciones por vencer y vencidas", () => {
  assert.deepEqual(kinds({ shipments: [shipment({ status: "QUOTING", quotesCount: 0, createdAt: d("2026-10-15") })] }), ["request_unquoted!"]);
  assert.deepEqual(
    kinds({
      quotes: [
        { number: "COT-1", client: "A", validUntil: d("2026-10-21"), shipmentNumber: null },
        { number: "COT-2", client: "B", validUntil: d("2026-10-18"), shipmentNumber: null },
        { number: "COT-3", client: "C", validUntil: d("2026-10-30"), shipmentNumber: null },
      ],
    }).sort(),
    ["quote_expired", "quote_expiring"],
  );
});

test("documentos del cliente faltantes cerca del arribo y saldo tras la entrega", () => {
  assert.deepEqual(
    kinds({ shipments: [shipment({ eta: d("2026-10-23"), arrivalNotice: { number: "AL", issuedAt: d("2026-10-20") }, pendingClientDocs: ["Factura comercial"] })] }),
    ["client_documents"],
  );
  assert.deepEqual(kinds({ shipments: [shipment({ status: "DELIVERED", balanceDue: [{ currency: "USD", balance: "120.00" }] })] }), ["balance_after_delivery"]);
});
