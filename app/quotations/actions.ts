"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { quotationSchema, QuotationFormValues } from "@/lib/validations/quotation";

function parseValidUntil(validUntil?: string | null): Date | null {
  if (!validUntil || !validUntil.trim()) return null;
  const d = new Date(validUntil);
  return isNaN(d.getTime()) ? null : d;
}

export async function createQuotationAction(data: QuotationFormValues) {
  const validated = quotationSchema.parse(data);

  // Generate unique code: e.g. COT-2026-0001
  const count = await prisma.quotation.count();
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, "0");
  const code = `COT-${year}-${sequence}`;

  // Process items and calculate totals and profits by currency
  let totalUsd = 0;
  let totalPen = 0;
  let profitUsd = 0;
  let profitPen = 0;

  const itemsWithTotal = validated.items.map((item) => {
    const saleTotal = Number((item.unitPrice * item.quantity).toFixed(2));
    const costTotal = Number((item.unitCost * item.quantity).toFixed(2));
    const itemProfit = Number((saleTotal - costTotal).toFixed(2));

    if (item.currency === "USD") {
      totalUsd += saleTotal;
      profitUsd += itemProfit;
    } else {
      totalPen += saleTotal;
      profitPen += itemProfit;
    }

    return {
      description: item.description.trim(),
      currency: item.currency,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: saleTotal,
      isTaxable: item.isTaxable ?? true,
    };
  });

  totalUsd = Number(totalUsd.toFixed(2));
  totalPen = Number(totalPen.toFixed(2));
  profitUsd = Number(profitUsd.toFixed(2));
  profitPen = Number(profitPen.toFixed(2));

  // Atomic Prisma Transaction
  await prisma.$transaction(async (tx) => {
    await tx.quotation.create({
      data: {
        code,
        clientId: validated.clientId,
        status: "DRAFT",
        validUntil: parseValidUntil(validated.validUntil),
        totalUsd,
        totalPen,
        profitUsd,
        profitPen,
        items: {
          createMany: {
            data: itemsWithTotal,
          },
        },
      },
    });
  });

  revalidatePath("/quotations");
  revalidatePath("/");
  redirect("/quotations");
}

export async function updateQuotationAction(quotationId: string, data: QuotationFormValues) {
  const validated = quotationSchema.parse(data);

  const existing = await prisma.quotation.findUnique({
    where: { id: quotationId },
  });

  if (!existing) {
    throw new Error("La cotización que intentas editar no existe.");
  }

  let totalUsd = 0;
  let totalPen = 0;
  let profitUsd = 0;
  let profitPen = 0;

  const itemsWithTotal = validated.items.map((item) => {
    const saleTotal = Number((item.unitPrice * item.quantity).toFixed(2));
    const costTotal = Number((item.unitCost * item.quantity).toFixed(2));
    const itemProfit = Number((saleTotal - costTotal).toFixed(2));

    if (item.currency === "USD") {
      totalUsd += saleTotal;
      profitUsd += itemProfit;
    } else {
      totalPen += saleTotal;
      profitPen += itemProfit;
    }

    return {
      description: item.description.trim(),
      currency: item.currency,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: saleTotal,
      isTaxable: item.isTaxable ?? true,
    };
  });

  totalUsd = Number(totalUsd.toFixed(2));
  totalPen = Number(totalPen.toFixed(2));
  profitUsd = Number(profitUsd.toFixed(2));
  profitPen = Number(profitPen.toFixed(2));

  await prisma.$transaction(async (tx) => {
    await tx.quotationItem.deleteMany({
      where: { quotationId },
    });

    await tx.quotation.update({
      where: { id: quotationId },
      data: {
        clientId: validated.clientId,
        validUntil: parseValidUntil(validated.validUntil),
        totalUsd,
        totalPen,
        profitUsd,
        profitPen,
        items: {
          createMany: {
            data: itemsWithTotal,
          },
        },
      },
    });
  });

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath("/clients");
  redirect(`/quotations/${quotationId}`);
}
