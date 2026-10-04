import Decimal from "decimal.js";
import type { Db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import type {
  ChargeBasis,
  ChargeBilling,
  ChargeGroup,
  Currency,
  EquipmentType,
  PaymentKind,
  PaymentMethod,
  StatementType,
  TaxTreatment,
} from "@/generated/prisma/enums";
import { computeQuantity, lineAmount, round2 } from "@/lib/pricing/quantity";
import { computeTotals, type Totals } from "@/lib/pricing/totals";
import { nextSequence } from "@/server/sequences";
import { DomainError, setMilestone, type Actor } from "@/server/expedientes";

/** Qué documento cobra cada sección: la agencia de carga (aviso de llegada) o la de aduanas. */
export const FREIGHT_GROUPS: ChargeGroup[] = ["ORIGIN", "FREIGHT", "INSURANCE", "DESTINATION"];
export const chargeStage = (group: ChargeGroup): ChargeBilling =>
  FREIGHT_GROUPS.includes(group) ? "ARRIVAL_NOTICE" : "CUSTOMS_SETTLEMENT";

/** Documento en que se cobra un cargo: lo elegido en el cargo o, si no, según su sección. */
export const billingOf = (c: { group: ChargeGroup; billedIn?: ChargeBilling | null }): ChargeBilling => c.billedIn ?? chargeStage(c.group);

export const STATEMENT_PREFIX: Record<StatementType, string> = {
  ARRIVAL_NOTICE: "AL",
  CUSTOMS_SETTLEMENT: "LA",
  FINAL_SETTLEMENT: "LF",
  REIMBURSEMENT_RECEIPT: "RI",
};

export interface ChargeInput {
  conceptId?: string | null;
  description: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  basis?: ChargeBasis;
  billedIn?: ChargeBilling | null;
  quantity: number;
  currency: Currency;
  unitCost: number;
  unitPrice: number;
  notes?: string | null;
}

async function shipmentFor(tx: Prisma.TransactionClient, actor: Actor, shipmentId: string) {
  const shipment = await tx.shipment.findFirst({ where: { id: shipmentId, organizationId: actor.organizationId } });
  if (!shipment) throw new DomainError("El expediente no existe.");
  return shipment;
}

const amounts = (c: { quantity: number; unitCost: number; unitPrice: number }) => ({
  totalCost: lineAmount({ quantity: c.quantity, unitAmount: c.unitCost }).toFixed(2),
  totalPrice: lineAmount({ quantity: c.quantity, unitAmount: c.unitPrice }).toFixed(2),
});

/** Cargo adicional (variación de tarifa, canal rojo, almacenaje extra…). */
export async function addCharge(db: Db, actor: Actor, shipmentId: string, input: ChargeInput) {
  return db.$transaction(async (tx) => {
    const shipment = await shipmentFor(tx, actor, shipmentId);
    const last = await tx.shipmentCharge.findFirst({ where: { shipmentId }, orderBy: { sortOrder: "desc" } });
    const concept = input.conceptId
      ? await tx.chargeConcept.findFirst({ where: { id: input.conceptId, organizationId: actor.organizationId }, select: { billedIn: true } })
      : null;
    const charge = await tx.shipmentCharge.create({
      data: {
        organizationId: actor.organizationId,
        shipmentId,
        conceptId: input.conceptId || null,
        source: "EXTRA",
        description: input.description.trim(),
        group: input.group,
        taxTreatment: input.taxTreatment,
        basis: input.basis ?? "MANUAL",
        billedIn: input.billedIn ?? concept?.billedIn ?? null,
        quantity: String(input.quantity),
        currency: input.currency,
        unitCost: String(input.unitCost),
        unitPrice: String(input.unitPrice),
        ...amounts(input),
        notes: input.notes?.trim() || null,
        sortOrder: (last?.sortOrder ?? 0) + 10,
        createdById: actor.userId,
      },
    });
    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: shipment.clientId,
        shipmentId,
        type: "charge.added",
        title: `Cargo adicional: ${charge.description}`,
        body: `${charge.currency} ${charge.totalPrice}`,
        actorUserId: actor.userId,
      },
    });
    return charge;
  });
}

/** Cambia cantidad o montos de un cargo (queda registrado el antes y el después). */
export async function updateCharge(
  db: Db,
  actor: Actor,
  chargeId: string,
  input: Pick<ChargeInput, "quantity" | "unitCost" | "unitPrice"> & Partial<Pick<ChargeInput, "description" | "taxTreatment" | "group">>,
) {
  return db.$transaction(async (tx) => {
    const charge = await tx.shipmentCharge.findFirst({ where: { id: chargeId, organizationId: actor.organizationId }, include: { shipment: true } });
    if (!charge) throw new DomainError("El cargo no existe.");
    const updated = await tx.shipmentCharge.update({
      where: { id: charge.id },
      data: {
        quantity: String(input.quantity),
        unitCost: String(input.unitCost),
        unitPrice: String(input.unitPrice),
        ...amounts(input),
        ...(input.description?.trim() ? { description: input.description.trim() } : {}),
        ...(input.taxTreatment ? { taxTreatment: input.taxTreatment } : {}),
        ...(input.group ? { group: input.group } : {}),
        source: charge.source === "QUOTE" ? "ADJUSTMENT" : charge.source,
      },
    });
    if (updated.totalPrice.toString() !== charge.totalPrice.toString()) {
      await tx.activityEvent.create({
        data: {
          organizationId: actor.organizationId,
          clientId: charge.shipment.clientId,
          shipmentId: charge.shipmentId,
          type: "charge.updated",
          title: `Cargo modificado: ${updated.description}`,
          body: `${charge.currency} ${charge.totalPrice} → ${updated.totalPrice}`,
          actorUserId: actor.userId,
        },
      });
    }
  });
}

export async function deleteCharge(db: Db, actor: Actor, chargeId: string) {
  return db.$transaction(async (tx) => {
    const charge = await tx.shipmentCharge.findFirst({ where: { id: chargeId, organizationId: actor.organizationId }, include: { shipment: true } });
    if (!charge) throw new DomainError("El cargo no existe.");
    await tx.shipmentCharge.delete({ where: { id: charge.id } });
    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: charge.shipment.clientId,
        shipmentId: charge.shipmentId,
        type: "charge.deleted",
        title: `Cargo eliminado: ${charge.description}`,
        body: `${charge.currency} ${charge.totalPrice}`,
        actorUserId: actor.userId,
      },
    });
  });
}

export interface PaymentInput {
  amount: number;
  currency: Currency;
  kind: PaymentKind;
  method: PaymentMethod;
  bank?: string | null;
  reference?: string | null;
  paidAt: Date;
  notes?: string | null;
}

/** Depósito del cliente. El primero marca el hito "Depósito recibido". */
export async function addPayment(db: Db, actor: Actor, shipmentId: string, input: PaymentInput) {
  if (!(input.amount > 0)) throw new DomainError("El monto debe ser mayor a cero.");
  const milestoneId = await db.$transaction(async (tx) => {
    const shipment = await shipmentFor(tx, actor, shipmentId);
    await tx.payment.create({
      data: {
        organizationId: actor.organizationId,
        clientId: shipment.clientId,
        shipmentId,
        kind: input.kind,
        method: input.method,
        amount: round2(new Decimal(input.amount)).toString(),
        currency: input.currency,
        bank: input.bank?.trim() || null,
        reference: input.reference?.trim() || null,
        paidAt: input.paidAt,
        notes: input.notes?.trim() || null,
        createdById: actor.userId,
      },
    });
    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: shipment.clientId,
        shipmentId,
        type: "payment.added",
        title: `Depósito registrado: ${input.currency} ${input.amount.toFixed(2)}`,
        body: [input.bank, input.reference].filter(Boolean).join(" · ") || null,
        visibility: "CLIENT",
        actorUserId: actor.userId,
      },
    });
    const m = await tx.shipmentMilestone.findFirst({
      where: { shipmentId, status: "PENDING", definition: { code: "FUNDS_RECEIVED" } },
      select: { id: true },
    });
    return m?.id ?? null;
  });
  if (milestoneId) await setMilestone(db, actor, milestoneId, { status: "DONE", completedAt: input.paidAt });
}

export async function deletePayment(db: Db, actor: Actor, paymentId: string) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({ where: { id: paymentId, organizationId: actor.organizationId } });
    if (!payment) throw new DomainError("El depósito no existe.");
    await tx.payment.delete({ where: { id: payment.id } });
    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: payment.clientId,
        shipmentId: payment.shipmentId,
        type: "payment.deleted",
        title: `Depósito eliminado: ${payment.currency} ${payment.amount}`,
        actorUserId: actor.userId,
      },
    });
  });
}

export interface BalanceRow {
  currency: Currency;
  charged: string;
  paid: string;
  balance: string; // positivo = el cliente debe; negativo = a favor del cliente
}

/** Saldo por moneda: total de cargos (con IGV) menos depósitos. */
export function computeBalance(totals: Totals, payments: { currency: Currency; amount: Decimal.Value | { toString(): string } }[]): BalanceRow[] {
  const currencies = new Set<Currency>([...(Object.keys(totals) as Currency[]), ...payments.map((p) => p.currency)]);
  return [...currencies]
    .sort((a) => (a === "USD" ? -1 : 1))
    .map((currency) => {
      const charged = new Decimal(totals[currency]?.total ?? 0);
      const paid = payments
        .filter((p) => p.currency === currency)
        .reduce((sum, p) => sum.plus(new Decimal(p.amount.toString())), new Decimal(0));
      return { currency, charged: charged.toFixed(2), paid: round2(paid).toFixed(2), balance: round2(charged.minus(paid)).toFixed(2) };
    });
}

export interface StatementLine {
  description: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  basis: ChargeBasis;
  quantity: string;
  currency: Currency;
  unitPrice: string;
  totalPrice: string;
  source: string;
}

/** Emite un aviso de llegada, liquidación o recibo con copia de los cargos. Anula el anterior del mismo tipo. */
export async function issueStatement(db: Db, actor: Actor, shipmentId: string, type: StatementType, notes?: string | null) {
  const result = await db.$transaction(async (tx) => {
    const shipment = await shipmentFor(tx, actor, shipmentId);
    const org = await tx.organization.findUniqueOrThrow({ where: { id: actor.organizationId } });
    const charges = await tx.shipmentCharge.findMany({ where: { shipmentId }, orderBy: { sortOrder: "asc" } });
    const selected = charges.filter((c) =>
      type === "ARRIVAL_NOTICE"
        ? billingOf(c) === "ARRIVAL_NOTICE"
        : type === "CUSTOMS_SETTLEMENT"
          ? billingOf(c) === "CUSTOMS_SETTLEMENT"
          : type === "REIMBURSEMENT_RECEIPT"
            ? c.taxTreatment === "REIMBURSABLE"
            : true,
    );
    if (selected.length === 0) throw new DomainError("No hay cargos para este documento.");

    const totals = computeTotals(selected, org.taxRate.toString());
    const payments = type === "FINAL_SETTLEMENT" ? await tx.payment.findMany({ where: { shipmentId }, orderBy: { paidAt: "asc" } }) : [];
    const year = new Date().getFullYear();
    const prefix = STATEMENT_PREFIX[type];
    const seq = await nextSequence(tx, actor.organizationId, `STATEMENT:${prefix}:${year}`);
    const number = `${prefix}-${year}-${String(seq).padStart(4, "0")}`;

    await tx.statement.updateMany({ where: { shipmentId, type, status: "ISSUED" }, data: { status: "VOID" } });
    const statement = await tx.statement.create({
      data: {
        organizationId: actor.organizationId,
        shipmentId,
        clientId: shipment.clientId,
        type,
        number,
        lines: selected.map<StatementLine>((c) => ({
          description: c.description,
          group: c.group,
          taxTreatment: c.taxTreatment,
          basis: c.basis,
          quantity: c.quantity.toString(),
          currency: c.currency,
          unitPrice: c.unitPrice.toString(),
          totalPrice: c.totalPrice.toString(),
          source: c.source,
        })) as unknown as Prisma.InputJsonValue,
        totals: totals as Prisma.InputJsonValue,
        payments:
          type === "FINAL_SETTLEMENT"
            ? (payments.map((p) => ({
                paidAt: p.paidAt.toISOString(),
                amount: p.amount.toString(),
                currency: p.currency,
                bank: p.bank,
                reference: p.reference,
              })) as Prisma.InputJsonValue)
            : undefined,
        balance: type === "FINAL_SETTLEMENT" ? (computeBalance(totals, payments) as unknown as Prisma.InputJsonValue) : undefined,
        notes: notes?.trim() || null,
        createdById: actor.userId,
      },
    });

    const label = {
      ARRIVAL_NOTICE: "Aviso de llegada",
      CUSTOMS_SETTLEMENT: "Liquidación de aduanas",
      FINAL_SETTLEMENT: "Liquidación final",
      REIMBURSEMENT_RECEIPT: "Recibo de reembolso",
    }[type];
    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: shipment.clientId,
        shipmentId,
        type: "statement.issued",
        title: `${label} ${number} emitido`,
        visibility: "CLIENT",
        actorUserId: actor.userId,
        data: { statementId: statement.id },
      },
    });

    const milestoneCode = type === "ARRIVAL_NOTICE" ? "ARRIVAL_NOTICE_SENT" : type === "CUSTOMS_SETTLEMENT" ? "CUSTOMS_SETTLEMENT_SENT" : null;
    const milestone = milestoneCode
      ? await tx.shipmentMilestone.findFirst({ where: { shipmentId, status: "PENDING", definition: { code: milestoneCode } }, select: { id: true } })
      : null;
    return { statement, milestoneId: milestone?.id ?? null };
  });
  if (result.milestoneId) await setMilestone(db, actor, result.milestoneId, { status: "DONE" });
  return result.statement;
}

export async function voidStatement(db: Db, actor: Actor, statementId: string) {
  const statement = await db.statement.findFirst({ where: { id: statementId, organizationId: actor.organizationId } });
  if (!statement) throw new DomainError("El documento no existe.");
  await db.statement.update({ where: { id: statement.id }, data: { status: "VOID" } });
}

/** Cambia el documento en que se cobra un cargo (aviso de llegada o liquidación de aduanas). */
export async function setChargeBilling(db: Db, actor: Actor, chargeId: string, billedIn: ChargeBilling) {
  const charge = await db.shipmentCharge.findFirst({ where: { id: chargeId, organizationId: actor.organizationId } });
  if (!charge) throw new DomainError("El cargo no existe.");
  await db.shipmentCharge.update({ where: { id: charge.id }, data: { billedIn } });
}

export interface RecalcChange {
  description: string;
  currency: Currency;
  oldQuantity: string;
  newQuantity: string;
  oldTotal: string;
  newTotal: string;
}

/** Bases que dependen de los datos de la carga (las demás no se recalculan). */
const CARGO_BASES: ChargeBasis[] = ["PER_WM", "PER_CBM", "PER_TON", "PER_KG", "PER_CHARGEABLE_KG", "PER_CONTAINER", "PER_PACKAGE", "PERCENT_FOB", "PERCENT_CIF"];

/**
 * Recalcula las cantidades de los cargos con el peso, volumen, bultos, contenedores y valor
 * actuales del expediente (p. ej. lo verificado por el depósito). Mantiene precios unitarios y mínimos.
 */
export async function recalcCharges(db: Db, actor: Actor, shipmentId: string): Promise<RecalcChange[]> {
  return db.$transaction(async (tx) => {
    const shipment = await tx.shipment.findFirst({
      where: { id: shipmentId, organizationId: actor.organizationId },
      include: { containers: true, charges: { include: { quoteLine: { select: { minPrice: true } } } } },
    });
    if (!shipment) throw new DomainError("El expediente no existe.");
    const counts = shipment.containers.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.equipment]: (acc[c.equipment] ?? 0) + 1 }), {});
    const cargo = {
      grossWeightKg: shipment.grossWeightKg,
      volumeCbm: shipment.volumeCbm,
      chargeableWeightKg: shipment.chargeableWeightKg,
      packages: shipment.packages,
      containers: Object.entries(counts).map(([equipment, quantity]) => ({ equipment: equipment as EquipmentType, quantity })),
      cifValue: shipment.cargoValue,
      fobValue: shipment.cargoValue,
    };
    const changes: RecalcChange[] = [];
    for (const c of shipment.charges) {
      if (!CARGO_BASES.includes(c.basis)) continue;
      const qty = computeQuantity(c.basis, cargo);
      if (!qty || qty.equals(new Decimal(c.quantity.toString()))) continue;
      const minPrice = c.quoteLine?.minPrice ?? null;
      const newTotal = lineAmount({ quantity: qty, unitAmount: c.unitPrice, minAmount: minPrice });
      const newCost = lineAmount({ quantity: qty, unitAmount: c.unitCost });
      await tx.shipmentCharge.update({
        where: { id: c.id },
        data: { quantity: qty.toString(), totalPrice: newTotal.toFixed(2), totalCost: newCost.toFixed(2), source: c.source === "QUOTE" ? "ADJUSTMENT" : c.source },
      });
      changes.push({
        description: c.description,
        currency: c.currency,
        oldQuantity: c.quantity.toString(),
        newQuantity: qty.toString(),
        oldTotal: c.totalPrice.toString(),
        newTotal: newTotal.toFixed(2),
      });
    }
    if (changes.length) {
      await tx.activityEvent.create({
        data: {
          organizationId: actor.organizationId,
          clientId: shipment.clientId,
          shipmentId,
          type: "charges.recalculated",
          title: `Cargos recalculados con la carga final (${changes.length})`,
          body: changes.map((x) => `${x.description}: ${x.oldQuantity} → ${x.newQuantity}`).join(" · "),
          actorUserId: actor.userId,
        },
      });
    }
    return changes;
  });
}
