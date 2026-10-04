"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db";
import { addCharge, addPayment, deleteCharge, deletePayment, issueStatement, recalcCharges, setChargeBilling, updateCharge, voidStatement } from "@/server/billing";
import { date, editorActor, num, oneOf, str, toActionError, type ActionState } from "@/server/action-utils";

const GROUPS = ["ORIGIN", "FREIGHT", "INSURANCE", "DESTINATION", "CUSTOMS", "INLAND_TRANSPORT", "STORAGE", "DUTIES_TAXES", "OTHER"] as const;
const TAXES = ["TAXED", "EXEMPT", "UNAFFECTED", "REIMBURSABLE"] as const;
const CURRENCIES = ["USD", "PEN"] as const;

const refresh = (fd: FormData) => revalidatePath(`/expedientes/${str(fd, "number")}`);

export async function addChargeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const description = str(fd, "description");
    if (!description) return { error: "Escribe el concepto." };
    await addCharge(getDb(), await editorActor(), str(fd, "shipmentId") ?? "", {
      conceptId: str(fd, "conceptId"),
      description,
      group: oneOf(fd, "group", GROUPS, "OTHER"),
      taxTreatment: oneOf(fd, "taxTreatment", TAXES, "TAXED"),
      quantity: num(fd, "quantity") ?? 1,
      currency: oneOf(fd, "currency", CURRENCIES, "USD"),
      unitCost: num(fd, "unitCost") ?? 0,
      unitPrice: num(fd, "unitPrice") ?? 0,
      notes: str(fd, "notes"),
    });
  } catch (err) {
    return toActionError(err);
  }
  refresh(fd);
  return { ok: "Cargo agregado" };
}

export async function updateChargeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await updateCharge(getDb(), await editorActor(), str(fd, "chargeId") ?? "", {
      quantity: num(fd, "quantity") ?? 1,
      unitCost: num(fd, "unitCost") ?? 0,
      unitPrice: num(fd, "unitPrice") ?? 0,
    });
  } catch (err) {
    return toActionError(err);
  }
  refresh(fd);
  return { ok: "Cargo actualizado" };
}

export async function deleteChargeAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await deleteCharge(getDb(), await editorActor(), str(fd, "chargeId") ?? "");
  } catch (err) {
    return toActionError(err);
  }
  refresh(fd);
  return { ok: "Cargo eliminado" };
}

export async function addPaymentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await addPayment(getDb(), await editorActor(), str(fd, "shipmentId") ?? "", {
      amount: num(fd, "amount") ?? 0,
      currency: oneOf(fd, "currency", CURRENCIES, "USD"),
      kind: oneOf(fd, "kind", ["ADVANCE", "SETTLEMENT", "REFUND"] as const, "ADVANCE"),
      method: oneOf(fd, "method", ["BANK_TRANSFER", "DEPOSIT", "CASH", "CHECK", "CARD", "OTHER"] as const, "BANK_TRANSFER"),
      bank: str(fd, "bank"),
      reference: str(fd, "reference"),
      paidAt: date(fd, "paidAt") ?? new Date(),
      notes: str(fd, "notes"),
    });
  } catch (err) {
    return toActionError(err);
  }
  refresh(fd);
  return { ok: "Depósito registrado" };
}

export async function deletePaymentAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await deletePayment(getDb(), await editorActor(), str(fd, "paymentId") ?? "");
  } catch (err) {
    return toActionError(err);
  }
  refresh(fd);
  return { ok: "Depósito eliminado" };
}

export async function issueStatementAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const statement = await issueStatement(
      getDb(),
      await editorActor(),
      str(fd, "shipmentId") ?? "",
      oneOf(fd, "type", ["ARRIVAL_NOTICE", "CUSTOMS_SETTLEMENT", "FINAL_SETTLEMENT", "REIMBURSEMENT_RECEIPT"] as const, "ARRIVAL_NOTICE"),
      str(fd, "notes"),
    );
    refresh(fd);
    return { ok: `Emitido ${statement.number}` };
  } catch (err) {
    return toActionError(err);
  }
}

export async function voidStatementAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await voidStatement(getDb(), await editorActor(), str(fd, "statementId") ?? "");
  } catch (err) {
    return toActionError(err);
  }
  refresh(fd);
  return { ok: "Documento anulado" };
}

export async function setChargeBillingAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await setChargeBilling(
      getDb(),
      await editorActor(),
      str(fd, "chargeId") ?? "",
      oneOf(fd, "billedIn", ["ARRIVAL_NOTICE", "CUSTOMS_SETTLEMENT"] as const, "ARRIVAL_NOTICE"),
    );
  } catch (err) {
    return toActionError(err);
  }
  refresh(fd);
  return { ok: "Documento de cobro actualizado" };
}

export async function recalcChargesAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const changes = await recalcCharges(getDb(), await editorActor(), str(fd, "shipmentId") ?? "");
    refresh(fd);
    if (changes.length === 0) return { ok: "Sin cambios: las cantidades ya coinciden con la carga del expediente." };
    return {
      ok: `Actualizados: ${changes.map((c) => `${c.description} ${c.oldQuantity} → ${c.newQuantity} (${c.currency} ${c.oldTotal} → ${c.newTotal})`).join(" · ")}`,
    };
  } catch (err) {
    return toActionError(err);
  }
}
