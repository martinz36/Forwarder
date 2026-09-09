"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export interface InvoiceItemInput {
  sku?: string;
  description: string;
  quantity: number;
  unitFob: number;
}

export interface CalculateLandedCostInput {
  operationId: string;
  invoiceNumber?: string;
  exchangeRate: number; // PEN per USD
  items: InvoiceItemInput[];
}

export async function saveAndCalculateLandedCostAction(input: CalculateLandedCostInput) {
  if (!input.operationId) {
    throw new Error("ID de operación no válido.");
  }

  if (input.items.length === 0) {
    throw new Error("Debes incluir al menos un producto en la factura comercial.");
  }

  const exchangeRate = input.exchangeRate > 0 ? input.exchangeRate : 3.75;

  // 1. Fetch Operation with charges
  const operation = await prisma.operation.findUnique({
    where: { id: input.operationId },
    include: { charges: true },
  });

  if (!operation) {
    throw new Error("Operación no encontrada.");
  }

  // 2. Sum total logistics expenses from charges
  let totalChargesUsd = 0;
  let totalChargesPen = 0;

  operation.charges.forEach((c) => {
    if (c.currency === "PEN") {
      totalChargesPen += c.totalPrice;
    } else {
      totalChargesUsd += c.totalPrice;
    }
  });

  // Convert total logistics expenses to USD and PEN using exchangeRate
  const totalLogisticsExpenseUsd = totalChargesUsd + (totalChargesPen / exchangeRate);
  const totalLogisticsExpensePen = (totalChargesUsd * exchangeRate) + totalChargesPen;

  // 3. Compute Total FOB from input items
  let sumTotalFobUsd = 0;
  const processedItems = input.items.map((item) => {
    const qty = Math.max(1, Math.round(item.quantity));
    const unitFob = Math.max(0, item.unitFob);
    const totalFob = Number((qty * unitFob).toFixed(2));
    sumTotalFobUsd += totalFob;

    return {
      sku: item.sku?.trim() || null,
      description: item.description.trim() || "Producto Sin Descripción",
      quantity: qty,
      unitFob,
      totalFob,
    };
  });

  sumTotalFobUsd = Number(sumTotalFobUsd.toFixed(2));

  // 4. Calculate Proration Factor
  // Proration Factor = Total Logistics Expenses USD / Total FOB USD
  const prorationFactor = sumTotalFobUsd > 0 ? totalLogisticsExpenseUsd / sumTotalFobUsd : 0;

  // 5. Calculate allocated expenses and final landed cost per item
  const finalItems = processedItems.map((item) => {
    const allocatedExpenseUsd = Number((item.unitFob * prorationFactor).toFixed(4));
    const finalUnitCostUsd = Number((item.unitFob + allocatedExpenseUsd).toFixed(4));

    const allocatedExpensePen = Number((allocatedExpenseUsd * exchangeRate).toFixed(4));
    const finalUnitCostPen = Number((finalUnitCostUsd * exchangeRate).toFixed(4));

    return {
      sku: item.sku,
      description: item.description,
      quantity: item.quantity,
      unitFob: item.unitFob,
      totalFob: item.totalFob,
      allocatedExpenseUsd,
      finalUnitCostUsd,
      allocatedExpensePen,
      finalUnitCostPen,
    };
  });

  // 6. Prisma Upsert CommercialInvoice & InvoiceItems in a transaction
  await prisma.$transaction(async (tx) => {
    // Delete existing invoice items if invoice already exists
    const existingInvoice = await tx.commercialInvoice.findUnique({
      where: { operationId: input.operationId },
    });

    if (existingInvoice) {
      await tx.invoiceItem.deleteMany({
        where: { commercialInvoiceId: existingInvoice.id },
      });
    }

    // Upsert commercial invoice
    const invoice = await tx.commercialInvoice.upsert({
      where: { operationId: input.operationId },
      update: {
        invoiceNumber: input.invoiceNumber?.trim() || null,
        fobTotal: sumTotalFobUsd,
        exchangeRate,
      },
      create: {
        operationId: input.operationId,
        invoiceNumber: input.invoiceNumber?.trim() || null,
        fobTotal: sumTotalFobUsd,
        exchangeRate,
      },
    });

    // Create invoice items
    await tx.invoiceItem.createMany({
      data: finalItems.map((fi) => ({
        commercialInvoiceId: invoice.id,
        ...fi,
      })),
    });
  });

  revalidatePath(`/operations/${input.operationId}`);
  return { success: true, prorationFactor };
}

export async function deleteCommercialInvoiceAction(operationId: string) {
  const existingInvoice = await prisma.commercialInvoice.findUnique({
    where: { operationId },
  });

  if (existingInvoice) {
    await prisma.commercialInvoice.delete({
      where: { id: existingInvoice.id },
    });
  }

  revalidatePath(`/operations/${operationId}`);
}
