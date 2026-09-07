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
    // Already converted, redirect to existing operation
    redirect(`/operations/${quotation.operation.id}`);
  }

  let newOperationId = "";

  await prisma.$transaction(async (tx) => {
    // 1. Update quotation status to ACCEPTED
    await tx.quotation.update({
      where: { id: quotationId },
      data: { status: "ACCEPTED" },
    });

    // 2. Create Operation
    const operation = await tx.operation.create({
      data: {
        quotationId: quotation.id,
        status: "EN_TRANSITO",
      },
    });

    newOperationId = operation.id;

    // 3. Copy QuotationItems to OperationCharge (isExtraCharge = false)
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
        };
      });

      await tx.operationCharge.createMany({
        data: chargesData,
      });
    }
  });

  revalidatePath("/operations");
  revalidatePath("/quotations");
  revalidatePath("/");
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
    },
  });

  revalidatePath(`/operations/${operationId}`);
}

export async function deleteExtraChargeAction(chargeId: string, operationId: string) {
  await prisma.operationCharge.deleteMany({
    where: {
      id: chargeId,
      operationId,
      isExtraCharge: true, // Safety check to prevent deleting base charges
    },
  });

  revalidatePath(`/operations/${operationId}`);
}
