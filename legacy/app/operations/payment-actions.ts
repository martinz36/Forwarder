"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function toggleChargeAdvanceAction(
  chargeId: string,
  operationId: string,
  currentIsAdvance: boolean
) {
  await prisma.operationCharge.update({
    where: {
      id: chargeId,
      operationId,
    },
    data: {
      isAdvance: !currentIsAdvance,
    },
  });

  revalidatePath(`/operations/${operationId}`);
  revalidatePath(`/liquidations/${operationId}`);
}

export async function addPaymentRecordAction(
  operationId: string,
  data: {
    concept: string;
    amount: number;
    currency: string;
    bank?: string;
    operationNumber?: string;
    paymentDate?: string;
  }
) {
  if (!data.concept || !data.concept.trim()) {
    throw new Error("El concepto del pago es obligatorio.");
  }
  if (!data.amount || data.amount <= 0) {
    throw new Error("El monto debe ser mayor a 0.");
  }

  await prisma.paymentRecord.create({
    data: {
      operationId,
      concept: data.concept.trim(),
      amount: data.amount,
      currency: data.currency || "USD",
      bank: data.bank ? data.bank.trim() : null,
      operationNumber: data.operationNumber ? data.operationNumber.trim() : null,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
    },
  });

  revalidatePath(`/operations/${operationId}`);
  revalidatePath(`/liquidations/${operationId}`);
}

export async function deletePaymentRecordAction(
  paymentRecordId: string,
  operationId: string
) {
  await prisma.paymentRecord.deleteMany({
    where: {
      id: paymentRecordId,
      operationId,
    },
  });

  revalidatePath(`/operations/${operationId}`);
  revalidatePath(`/liquidations/${operationId}`);
}
