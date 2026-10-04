/**
 * Flujo completo contra una base real (PGlite con las migraciones de producción):
 * solicitud → cotización → versiones → aceptación → operación → cobranza → PDF,
 * más rechazo, FCL, aéreo y aislamiento entre empresas.
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { extractText } from "unpdf";
import { startTestDb } from "./helpers/test-db";
import type { Db } from "../src/server/db";
import { setupOrganization } from "../src/server/setup/organization";
import { createExpediente, DomainError, setMilestone, updateExpediente, type Actor } from "../src/server/expedientes";
import { createNewVersion, createQuote, respondQuote, saveDraft, sendVersion, type DraftInput } from "../src/server/quotes";
import { addCharge, addPayment, deleteCharge, deletePayment, issueStatement, updateCharge, voidStatement, computeBalance } from "../src/server/billing";
import { renderQuotePdf } from "../src/server/quote-pdf";
import { renderStatementPdf } from "../src/server/statement-pdf";
import { computeTotals } from "../src/lib/pricing/totals";
import { nextQuoteNumber } from "../src/server/sequences";

let db: Db;
let stop: () => Promise<void>;
let actor: Actor;
let otherActor: Actor;
const year = new Date().getFullYear();

async function pdfText(buffer: Buffer) {
  const { text } = await extractText(new Uint8Array(buffer));
  return (Array.isArray(text) ? text : [text]).join("\n");
}
const milestone = (shipmentId: string, code: string) =>
  db.shipmentMilestone.findFirstOrThrow({ where: { shipmentId, definition: { code } } });
const template = (name: string) => db.quoteTemplate.findFirstOrThrow({ where: { organizationId: actor.organizationId, name } });

/** Convierte la versión guardada al formato del editor (para modificarla y volver a guardar). */
async function draftOf(versionId: string): Promise<DraftInput> {
  const v = await db.quoteVersion.findUniqueOrThrow({ where: { id: versionId }, include: { lines: { orderBy: { sortOrder: "asc" } } } });
  return {
    incoterm: v.incoterm,
    validUntil: v.validUntil,
    originId: v.originId,
    destinationId: v.destinationId,
    commodity: v.commodity,
    grossWeightKg: v.grossWeightKg ? Number(v.grossWeightKg) : null,
    volumeCbm: v.volumeCbm ? Number(v.volumeCbm) : null,
    notes: v.notes,
    lines: v.lines.map((l) => ({
      conceptId: l.conceptId,
      description: l.description,
      group: l.group,
      taxTreatment: l.taxTreatment,
      basis: l.basis,
      quantity: Number(l.quantity),
      currency: l.currency,
      unitCost: Number(l.unitCost),
      unitPrice: Number(l.unitPrice),
      minPrice: l.minPrice ? Number(l.minPrice) : null,
      isOptional: l.isOptional,
    })),
  };
}

before(async () => {
  ({ db, stop } = await startTestDb());
  const org = await setupOrganization(db, { slug: "marivan", name: "Marivan Logistics", legalName: "Marivan Logistics SAC", taxId: "20612345678" });
  await db.organization.update({ where: { id: org.id }, data: { quoteValidityDays: 10, paymentInstructions: "BCP Dólares 191-0000000-1-00" } });
  const user = await db.user.create({ data: { name: "Operador", email: "operador@prueba.test" } });
  actor = { organizationId: org.id, userId: user.id };
  const other = await setupOrganization(db, { slug: "otra", name: "Otra Agencia", legalName: "Otra Agencia SAC" });
  otherActor = { organizationId: other.id, userId: null };
});

after(async () => {
  await stop();
});

describe("importación LCL EXW: de la solicitud al cierre", () => {
  let shipmentId: string;
  let number: string;
  let quoteId: string;
  let quoteNumber: string;

  test("1. nueva solicitud con cliente nuevo abre el expediente en cotización", async () => {
    const shanghai = await db.location.findFirstOrThrow({ where: { organizationId: actor.organizationId, code: "CNSHA" } });
    const callao = await db.location.findFirstOrThrow({ where: { organizationId: actor.organizationId, code: "PECLL" } });
    const s = await createExpediente(db, actor, {
      newClient: { taxIdType: "RUC", taxId: "20601234567", legalName: "Importaciones Andinas SAC", contactName: "Rosa", email: "rosa@andinas.test" },
      direction: "IMPORT",
      mode: "SEA_LCL",
      incoterm: "EXW",
      originId: shanghai.id,
      destinationId: callao.id,
      includesFreight: true,
      includesCustoms: true,
      includesInland: true,
      includesInsurance: false,
      commodity: "Herramientas",
      grossWeightKg: 1450,
      volumeCbm: 3.2,
      packages: 4,
      packageType: "paletas",
      cargoValue: 18500,
    });
    shipmentId = s.id;
    number = s.number;
    assert.equal(s.number, `L-${year}-0001`);
    assert.equal(s.status, "QUOTING");
    const client = await db.client.findUniqueOrThrow({ where: { id: s.clientId }, include: { contacts: true } });
    assert.equal(client.status, "PROSPECT");
    assert.equal(client.contacts[0]?.email, "rosa@andinas.test");
    assert.equal((await milestone(s.id, "REQUEST_RECEIVED")).status, "DONE");
    assert.equal((await milestone(s.id, "AGENT_RATE_REQUESTED")).status, "PENDING");
    // Sin hitos operativos todavía
    assert.equal(await db.shipmentMilestone.count({ where: { shipmentId: s.id, definition: { phase: "OPERATION" } } }), 0);
  });

  test("2. el mismo RUC en otra solicitud reutiliza al cliente", async () => {
    const s = await createExpediente(db, actor, {
      newClient: { taxIdType: "RUC", taxId: "20601234567", legalName: "Otro nombre" },
      direction: "IMPORT",
      mode: "AIR",
      includesFreight: true,
      includesCustoms: true,
      includesInland: false,
      includesInsurance: false,
    });
    const first = await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
    assert.equal(s.clientId, first.clientId);
    assert.equal(s.number, `A-${year}-0002`, "un solo correlativo para todos los modos");
  });

  test("3. marcar hito con fecha y nota", async () => {
    const m = await milestone(shipmentId, "AGENT_RATE_REQUESTED");
    await setMilestone(db, actor, m.id, { status: "DONE", completedAt: new Date("2026-10-01T12:00:00-05:00"), note: "Pedido a agente X" });
    const after = await db.shipmentMilestone.findUniqueOrThrow({ where: { id: m.id } });
    assert.equal(after.status, "DONE");
    assert.equal(after.note, "Pedido a agente X");
    assert.equal(await db.activityEvent.count({ where: { shipmentId, type: "milestone.completed" } }), 1);
  });

  test("4. cotización desde plantilla LCL: EXW por incoterm, flete por W/M, seguro por % CIF", async () => {
    const q = await createQuote(db, actor, shipmentId, (await template("Importación marítima LCL")).id);
    quoteId = q.id;
    quoteNumber = q.number;
    assert.equal(q.number, `COT-${year}-0001`);
    const v = await db.quoteVersion.findFirstOrThrow({ where: { quoteId: q.id }, include: { lines: { orderBy: { sortOrder: "asc" } } } });
    const byName = (n: string) => v.lines.find((l) => l.description.startsWith(n));
    assert.ok(byName("Gastos EXW"), "con EXW aparece Gastos EXW");
    assert.equal(byName("Flete internacional LCL")?.quantity.toString(), "3.2");
    assert.equal(byName("Seguro de carga")?.quantity.toString(), "185");
    assert.equal(byName("Seguro de carga")?.isOptional, true);
    assert.equal(v.status, "DRAFT");
    // Validez por defecto: 10 días
    const days = Math.round((v.validUntil!.getTime() - Date.now()) / 86_400_000);
    assert.ok(days >= 9 && days <= 10, `validez ${days} días`);
  });

  test("5. guardar borrador recalcula totales en el servidor (IGV solo sobre lo afecto)", async () => {
    const v = await db.quoteVersion.findFirstOrThrow({ where: { quoteId } });
    const draft = await draftOf(v.id);
    draft.lines = draft.lines.map((l) =>
      l.description === "Flete internacional LCL" ? { ...l, unitCost: 220, unitPrice: 264 } : l.description === "Visto bueno" ? { ...l, unitCost: 120, unitPrice: 150 } : l,
    );
    // Precio absurdo en total: el servidor no confía en totales del navegador
    await saveDraft(db, actor, v.id, draft);
    const saved = await db.quoteVersion.findUniqueOrThrow({ where: { id: v.id }, include: { lines: true } });
    const freight = saved.lines.find((l) => l.description === "Flete internacional LCL")!;
    assert.equal(freight.totalPrice.toString(), "844.8");
    const totals = saved.totals as Record<string, { tax: string; taxed: string }>;
    const taxed = saved.lines.filter((l) => !l.isOptional && l.taxTreatment === "TAXED").reduce((s, l) => s + Number(l.totalPrice), 0);
    assert.equal(Number(totals.USD!.taxed), Math.round(taxed * 100) / 100);
    assert.equal(Number(totals.USD!.tax), Math.round(taxed * 0.18 * 100) / 100);
  });

  test("6. PDF del borrador lleva marca BORRADOR, totales y condiciones", async () => {
    const pdf = await renderQuotePdf(db, actor.organizationId, quoteNumber);
    const text = await pdfText(pdf!.buffer);
    assert.match(text, /BORRADOR/);
    assert.match(text, new RegExp(quoteNumber));
    assert.match(text, /TOTAL DÓLARES/);
    assert.match(text, /Página 1 de/);
    assert.match(text, /valor CIF USD\s+18,500\.00/);
  });

  test("7. enviar congela la versión y marca los pasos comerciales", async () => {
    const v = await db.quoteVersion.findFirstOrThrow({ where: { quoteId } });
    await sendVersion(db, actor, v.id);
    const sent = await db.quoteVersion.findUniqueOrThrow({ where: { id: v.id } });
    assert.equal(sent.status, "SENT");
    assert.ok(sent.terms && sent.terms.length > 20, "guarda copia de las condiciones");
    assert.equal((await milestone(shipmentId, "QUOTE_SENT")).status, "DONE");
    assert.equal((await milestone(shipmentId, "AGENT_RATE_RECEIVED")).status, "DONE", "lo previo queda cumplido");
    await assert.rejects(() => saveDraft(db, actor, v.id, { lines: [] }), DomainError, "no se edita lo enviado");
    await assert.rejects(() => sendVersion(db, actor, v.id), DomainError);
  });

  test("8. nueva versión: v2 en borrador, al enviarla la v1 queda reemplazada", async () => {
    const v2 = await createNewVersion(db, actor, quoteId);
    assert.equal(v2.versionNo, 2);
    assert.equal(v2.status, "DRAFT");
    const draft = await draftOf(v2.id);
    draft.lines = draft.lines.map((l) => (l.description === "Flete internacional LCL" ? { ...l, unitPrice: 250 } : l));
    await saveDraft(db, actor, v2.id, draft);
    await sendVersion(db, actor, v2.id);
    const versions = await db.quoteVersion.findMany({ where: { quoteId }, orderBy: { versionNo: "asc" } });
    assert.deepEqual(versions.map((x) => x.status), ["SUPERSEDED", "SENT"]);
    const q = await db.quote.findUniqueOrThrow({ where: { id: quoteId } });
    assert.equal(q.currentVersionNo, 2);
    // PDF de la v1 sigue disponible tal como se envió
    const v1pdf = await pdfText((await renderQuotePdf(db, actor.organizationId, quoteNumber, 1))!.buffer);
    assert.match(v1pdf, /USD 264\.00/);
    assert.doesNotMatch(v1pdf, /BORRADOR/);
  });

  test("9. aceptada: pasa a operación con cargos (sin opcionales), hitos y checklist", async () => {
    await respondQuote(db, actor, quoteId, "ACCEPTED", "Aceptó por correo");
    const s = await db.shipment.findUniqueOrThrow({
      where: { id: shipmentId },
      include: { charges: true, requirements: true, client: true, milestones: { include: { definition: true } } },
    });
    assert.equal(s.status, "CONFIRMED");
    assert.equal(s.client.status, "ACTIVE");
    const v2lines = await db.quoteLine.findMany({ where: { version: { quoteId, versionNo: 2 }, isOptional: false } });
    assert.equal(s.charges.length, v2lines.length);
    assert.ok(s.charges.every((c) => c.source === "QUOTE"));
    assert.equal(s.charges.find((c) => c.description === "Flete internacional LCL")?.unitPrice.toString(), "250", "los cargos salen de la versión aceptada");
    assert.ok(s.milestones.some((m) => m.definition?.code === "IMP_ARRIVED"));
    assert.equal(s.milestones.find((m) => m.definition?.code === "ORDER_CONFIRMED")?.status, "DONE");
    assert.ok(s.requirements.some((r) => r.title === "Factura comercial"));
    await assert.rejects(() => createNewVersion(db, actor, quoteId), DomainError, "una aceptada no se versiona");
  });

  test("10. datos operativos: BL, ETA y canal rojo", async () => {
    await updateExpediente(db, actor, shipmentId, {
      hblNumber: "HBL-001",
      vessel: "MSC ANNA",
      eta: new Date("2026-11-20T12:00:00-05:00"),
      customs: { regime: "IMPORT_FOR_CONSUMPTION", declarationNumber: "118-2026-10-123456", channel: "RED" },
    });
    const s = await db.shipment.findUniqueOrThrow({ where: { id: shipmentId }, include: { customsEntries: true } });
    assert.equal(s.hblNumber, "HBL-001");
    assert.equal(s.customsEntries[0]?.channel, "RED");
    assert.ok(s.customsEntries[0]?.channelAt);
  });

  test("11. hitos mueven el estado; deshacer lo recalcula; 'no aplica' no lo mueve", async () => {
    const departed = await milestone(shipmentId, "IMP_DEPARTED");
    await setMilestone(db, actor, departed.id, { status: "DONE" });
    assert.equal((await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } })).status, "IN_TRANSIT");
    await setMilestone(db, actor, departed.id, { status: "PENDING" });
    assert.equal((await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } })).status, "CONFIRMED");
    const pickup = await milestone(shipmentId, "IMP_PICKUP");
    await setMilestone(db, actor, pickup.id, { status: "SKIPPED", note: "Proveedor entrega en almacén" });
    assert.equal((await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } })).status, "CONFIRMED");
    await setMilestone(db, actor, departed.id, { status: "DONE" });
    // Aviso al cliente queda en cola (el hito avisa y es visible)
    assert.ok((await db.notificationOutbox.count({ where: { recipient: "rosa@andinas.test" } })) >= 1);
  });

  test("12. cargos: adicional por canal rojo, ajuste y eliminación con historial", async () => {
    const aforo = await addCharge(db, actor, shipmentId, {
      description: "Aforo físico", group: "CUSTOMS", taxTreatment: "REIMBURSABLE", quantity: 1, currency: "USD", unitCost: 120, unitPrice: 150,
    });
    assert.equal(aforo.source, "EXTRA");
    const vb = await db.shipmentCharge.findFirstOrThrow({ where: { shipmentId, description: "Visto bueno" } });
    await updateCharge(db, actor, vb.id, { quantity: 1, unitCost: 130, unitPrice: 165 });
    const vbAfter = await db.shipmentCharge.findUniqueOrThrow({ where: { id: vb.id } });
    assert.equal(vbAfter.source, "ADJUSTMENT");
    assert.equal(vbAfter.totalPrice.toString(), "165");
    const tmp = await addCharge(db, actor, shipmentId, { description: "Temporal", group: "OTHER", taxTreatment: "TAXED", quantity: 1, currency: "USD", unitCost: 0, unitPrice: 10 });
    await deleteCharge(db, actor, tmp.id);
    assert.equal(await db.shipmentCharge.count({ where: { id: tmp.id } }), 0);
    const types = (await db.activityEvent.findMany({ where: { shipmentId }, select: { type: true } })).map((e) => e.type);
    for (const t of ["charge.added", "charge.updated", "charge.deleted"]) assert.ok(types.includes(t), t);
  });

  test("13. aviso de llegada: solo gastos de la agencia de carga, con cuentas y hito", async () => {
    const st = await issueStatement(db, actor, shipmentId, "ARRIVAL_NOTICE");
    assert.equal(st.number, `AL-${year}-0001`);
    const lines = st.lines as { group: string }[];
    assert.ok(lines.every((l) => ["ORIGIN", "FREIGHT", "INSURANCE", "DESTINATION"].includes(l.group)));
    assert.equal((await milestone(shipmentId, "ARRIVAL_NOTICE_SENT")).status, "DONE");
    const text = await pdfText((await renderStatementPdf(db, actor.organizationId, st.number))!.buffer);
    assert.match(text, /AVISO DE LLEGADA/);
    assert.match(text, /BCP Dólares/);
    assert.match(text, /HBL-001/);
    assert.doesNotMatch(text, /Comisión de agencia de aduanas/);
  });

  test("14. depósito: saldo por moneda y hito de depósito", async () => {
    const al = await db.statement.findFirstOrThrow({ where: { shipmentId, type: "ARRIVAL_NOTICE", status: "ISSUED" } });
    const alTotal = Number((al.totals as Record<string, { total: string }>).USD!.total);
    await addPayment(db, actor, shipmentId, { amount: alTotal, currency: "USD", kind: "ADVANCE", method: "BANK_TRANSFER", bank: "BCP", reference: "123", paidAt: new Date() });
    assert.equal((await milestone(shipmentId, "FUNDS_RECEIVED")).status, "DONE");
    const s = await db.shipment.findUniqueOrThrow({ where: { id: shipmentId }, include: { charges: true, payments: true } });
    const org = await db.organization.findUniqueOrThrow({ where: { id: actor.organizationId } });
    const balance = computeBalance(computeTotals(s.charges, org.taxRate.toString()), s.payments);
    const usd = balance.find((b) => b.currency === "USD")!;
    assert.equal(Number(usd.paid), alTotal);
    assert.ok(Number(usd.balance) > 0, "aún falta la parte de aduanas");
    // Un depósito por error se puede borrar
    const wrong = await db.payment.create({ data: { organizationId: actor.organizationId, clientId: s.clientId, shipmentId, amount: "1", currency: "USD", paidAt: new Date() } });
    await deletePayment(db, actor, wrong.id);
    assert.equal(await db.payment.count({ where: { shipmentId } }), 1);
  });

  test("15. liquidación de aduanas, recibo de reembolso y liquidación final con saldo", async () => {
    const la = await issueStatement(db, actor, shipmentId, "CUSTOMS_SETTLEMENT");
    assert.equal(la.number, `LA-${year}-0001`);
    assert.ok((la.lines as { group: string }[]).some((l) => l.group === "CUSTOMS"));
    assert.ok((la.lines as { group: string }[]).every((l) => !["FREIGHT", "ORIGIN"].includes(l.group)));
    const ri = await issueStatement(db, actor, shipmentId, "REIMBURSEMENT_RECEIPT");
    assert.ok((ri.lines as { taxTreatment: string }[]).every((l) => l.taxTreatment === "REIMBURSABLE"));
    const lf = await issueStatement(db, actor, shipmentId, "FINAL_SETTLEMENT");
    const balance = lf.balance as { currency: string; balance: string }[];
    assert.ok(balance.length >= 1);
    const text = await pdfText((await renderStatementPdf(db, actor.organizationId, lf.number))!.buffer);
    assert.match(text, /LIQUIDACIÓN FINAL/);
    assert.match(text, /DEPÓSITOS RECIBIDOS/);
    assert.match(text, /SALDO A PAGAR/);
    for (const n of [la.number, ri.number]) {
      const t = await pdfText((await renderStatementPdf(db, actor.organizationId, n))!.buffer);
      assert.match(t, /Página 1 de/);
    }
  });

  test("16. reemitir anula el anterior; anular a mano también", async () => {
    const again = await issueStatement(db, actor, shipmentId, "ARRIVAL_NOTICE", "Incremento de flete");
    assert.equal(again.number, `AL-${year}-0002`);
    const all = await db.statement.findMany({ where: { shipmentId, type: "ARRIVAL_NOTICE" }, orderBy: { number: "asc" } });
    assert.deepEqual(all.map((x) => x.status), ["VOID", "ISSUED"]);
    await voidStatement(db, actor, again.id);
    const voided = await renderStatementPdf(db, actor.organizationId, again.number);
    assert.match(await pdfText(voided!.buffer), /ANULADO/);
  });
});

describe("otros caminos", () => {
  test("no aceptada: el expediente queda como no concretado", async () => {
    const s = await createExpediente(db, actor, {
      newClient: { taxIdType: "RUC", taxId: "20555555555", legalName: "Cliente Perdido SAC" },
      direction: "IMPORT", mode: "SEA_LCL", incoterm: "FOB", includesFreight: true, includesCustoms: true, includesInland: false, includesInsurance: false,
      grossWeightKg: 500, volumeCbm: 1,
    });
    const q = await createQuote(db, actor, s.id, (await template("Importación marítima LCL")).id);
    const v = await db.quoteVersion.findFirstOrThrow({ where: { quoteId: q.id }, include: { lines: true } });
    assert.ok(!v.lines.some((l) => l.description === "Gastos EXW"), "con FOB no van gastos EXW");
    await assert.rejects(() => respondQuote(db, actor, q.id, "ACCEPTED"), DomainError, "no se acepta sin enviar");
    await sendVersion(db, actor, v.id);
    await respondQuote(db, actor, q.id, "REJECTED", "Consiguió mejor tarifa");
    const after = await db.shipment.findUniqueOrThrow({ where: { id: s.id } });
    assert.equal(after.status, "LOST");
    const quote = await db.quote.findUniqueOrThrow({ where: { id: q.id } });
    assert.equal(quote.lostReason, "Consiguió mejor tarifa");
    await assert.rejects(() => createQuote(db, actor, s.id, null), DomainError, "no se cotiza un expediente cerrado");
  });

  test("FCL: flete y transporte por contenedor; CIF no lleva flete", async () => {
    const s = await createExpediente(db, actor, {
      newClient: { taxIdType: "RUC", taxId: "20666666666", legalName: "Muebles del Sur SAC" },
      direction: "IMPORT", mode: "SEA_FCL", incoterm: "FOB", includesFreight: true, includesCustoms: true, includesInland: true, includesInsurance: false,
      containers: [{ equipment: "HIGH_CUBE_40", quantity: 2 }],
    });
    assert.match(s.number, /^M-/);
    const q = await createQuote(db, actor, s.id, (await template("Importación marítima FCL")).id);
    const lines = await db.quoteLine.findMany({ where: { version: { quoteId: q.id } } });
    assert.equal(lines.find((l) => l.description === "Flete internacional FCL")?.quantity.toString(), "2");
    assert.equal(lines.find((l) => l.description === "Transporte local")?.quantity.toString(), "2");

    const cif = await createExpediente(db, actor, {
      clientId: s.clientId, direction: "IMPORT", mode: "SEA_FCL", incoterm: "CIF",
      includesFreight: true, includesCustoms: true, includesInland: true, includesInsurance: false,
      containers: [{ equipment: "DRY_20", quantity: 1 }],
    });
    const q2 = await createQuote(db, actor, cif.id, (await template("Importación marítima FCL")).id);
    const lines2 = await db.quoteLine.findMany({ where: { version: { quoteId: q2.id } } });
    assert.ok(!lines2.some((l) => l.description === "Flete internacional FCL"), "con CIF el flete lo paga el vendedor");
  });

  test("aéreo: el flete se cobra por peso cobrable (volumétrico)", async () => {
    const s = await createExpediente(db, actor, {
      newClient: { taxIdType: "RUC", taxId: "20777777777", legalName: "Repuestos Aéreos SAC" },
      direction: "IMPORT", mode: "AIR", incoterm: "FCA", includesFreight: true, includesCustoms: true, includesInland: false, includesInsurance: false,
      grossWeightKg: 50, volumeCbm: 1,
    });
    const q = await createQuote(db, actor, s.id, (await template("Importación aérea")).id);
    const freight = await db.quoteLine.findFirstOrThrow({ where: { version: { quoteId: q.id }, description: "Flete internacional aéreo" } });
    assert.equal(freight.quantity.toString(), "166.667");
  });

  test("aislamiento entre empresas: otra agencia no ve ni toca expedientes ajenos", async () => {
    const mine = await db.shipment.findFirstOrThrow({ where: { organizationId: actor.organizationId } });
    await assert.rejects(() => createQuote(db, otherActor, mine.id, null), DomainError);
    await assert.rejects(() => updateExpediente(db, otherActor, mine.id, { hblNumber: "X" }), DomainError);
    await assert.rejects(() => addCharge(db, otherActor, mine.id, { description: "x", group: "OTHER", taxTreatment: "TAXED", quantity: 1, currency: "USD", unitCost: 0, unitPrice: 1 }), DomainError);
    const charge = await db.shipmentCharge.findFirstOrThrow({ where: { organizationId: actor.organizationId } });
    await assert.rejects(() => updateCharge(db, otherActor, charge.id, { quantity: 1, unitCost: 0, unitPrice: 0 }), DomainError);
    const m = await db.shipmentMilestone.findFirstOrThrow({ where: { organizationId: actor.organizationId } });
    await assert.rejects(() => setMilestone(db, otherActor, m.id, { status: "DONE" }), DomainError);
    // Su numeración es independiente
    const own = await createExpediente(db, otherActor, {
      newClient: { taxIdType: "RUC", taxId: "20601234567", legalName: "Importaciones Andinas SAC" },
      direction: "IMPORT", mode: "SEA_LCL", includesFreight: true, includesCustoms: true, includesInland: false, includesInsurance: false,
    });
    assert.equal(own.number, `L-${year}-0001`, "cada agencia empieza su correlativo");
    const theirClient = await db.client.findUniqueOrThrow({ where: { id: own.clientId } });
    assert.equal(theirClient.organizationId, otherActor.organizationId, "mismo RUC, cliente propio de cada agencia");
  });

  test("correlativos sin duplicados aunque se pidan a la vez", async () => {
    const numbers = await Promise.all(Array.from({ length: 8 }, () => nextQuoteNumber(db, actor.organizationId)));
    assert.equal(new Set(numbers).size, numbers.length);
  });
});

describe("reabrir", () => {
  test("un expediente no concretado se puede reabrir y volver a cotizar", async () => {
    const lost = await db.shipment.findFirstOrThrow({ where: { organizationId: actor.organizationId, status: "LOST" } });
    const { reopenExpediente } = await import("../src/server/expedientes");
    await reopenExpediente(db, actor, lost.id);
    assert.equal((await db.shipment.findUniqueOrThrow({ where: { id: lost.id } })).status, "QUOTING");
    const q = await createQuote(db, actor, lost.id, null);
    assert.ok(q.number.startsWith("COT-"));
    await assert.rejects(() => reopenExpediente(db, actor, lost.id), DomainError, "solo desde no concretado");
  });
});
