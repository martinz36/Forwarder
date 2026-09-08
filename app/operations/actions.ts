"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import {
  operationHeaderSchema,
  extraChargeSchema,
  OperationHeaderFormValues,
  ExtraChargeFormValues,
} from "@/lib/validations/operation";

export async function createOperationFromQuotationAction(quotationId: string) {
  if (!quotationId) {
    throw new Error("ID de cotización no proporcionado.");
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true, operation: true },
  });

  if (!quotation) {
    throw new Error("La cotización especificada no existe.");
  }

  if (quotation.operation) {
    redirect(`/operations/${quotation.operation.id}`);
  }

  let newOperationId = "";

  await prisma.$transaction(async (tx) => {
    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: "ACCEPTED" },
    });

    const operation = await tx.operation.create({
      data: {
        quotationId: quotation.id,
        expedientId: quotation.expedientId || null,
        status: "EN_TRANSITO",
      },
    });

    if (quotation.expedientId) {
      await tx.expedient.update({
        where: { id: quotation.expedientId },
        data: { status: "IN_TRANSIT" },
      });
    }

    newOperationId = operation.id;

    if (quotation.items.length > 0) {
      const chargesData = quotation.items.map((item) => {
        const totalCost = Number((item.unitCost * item.quantity).toFixed(2));
        const totalPrice = Number((item.unitPrice * item.quantity).toFixed(2));

        return {
          operationId: operation.id,
          description: item.description,
          currency: item.currency,
          unitCost: item.unitCost,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalCost,
          totalPrice,
          isExtraCharge: false,
          isTaxable: item.isTaxable,
        };
      });

      await tx.operationCharge.createMany({
        data: chargesData,
      });
    }
  });

  revalidatePath("/operations");
  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotationId}`);

  redirect(`/operations/${newOperationId}`);
}

export async function updateOperationHeaderAction(
  operationId: string,
  data: OperationHeaderFormValues
) {
  const validated = operationHeaderSchema.parse(data);

  await prisma.operation.update({
    where: { id: operationId },
    data: {
      status: validated.status,
      blNumber: validated.blNumber ? validated.blNumber.trim() : null,
      etd: validated.etd ? new Date(validated.etd) : null,
      eta: validated.eta ? new Date(validated.eta) : null,
      customsChannel: validated.customsChannel ? (validated.customsChannel as any) : null,
    },
  });

  revalidatePath(`/operations/${operationId}`);
  revalidatePath("/operations");
}

export async function addExtraChargeAction(
  operationId: string,
  data: ExtraChargeFormValues
) {
  const validated = extraChargeSchema.parse(data);

  const totalCost = Number((validated.unitCost * validated.quantity).toFixed(2));
  const totalPrice = Number((validated.unitPrice * validated.quantity).toFixed(2));

  await prisma.operationCharge.create({
    data: {
      operationId,
      description: validated.description.trim(),
      currency: validated.currency,
      unitCost: validated.unitCost,
      unitPrice: validated.unitPrice,
      quantity: validated.quantity,
      totalCost,
      totalPrice,
      isExtraCharge: true,
      isTaxable: validated.isTaxable ?? true,
    },
  });

  revalidatePath(`/operations/${operationId}`);
}

export async function deleteExtraChargeAction(chargeId: string, operationId: string) {
  await prisma.operationCharge.deleteMany({
    where: {
      id: chargeId,
      operationId,
      isExtraCharge: true,
    },
  });

  revalidatePath(`/operations/${operationId}`);
}

export type OperationMilestoneKey =
  | "hblApproved"
  | "customsDocsSent"
  | "taxesPaid"
  | "transportDocsSent"
  | "cargoDelivered";

export async function toggleOperationMilestoneAction(
  operationId: string,
  milestone: OperationMilestoneKey,
  currentValue: boolean
) {
  await prisma.operation.update({
    where: { id: operationId },
    data: {
      [milestone]: !currentValue,
    },
  });

  revalidatePath(`/operations/${operationId}`);
  revalidatePath("/operations");
}
