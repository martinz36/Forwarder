"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { quotationSchema, QuotationFormValues } from "@/lib/validations/quotation";

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
      category: item.category || "GASTOS_LOCALES",
      currency: item.currency,
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: saleTotal,
      isTaxable: item.isTaxable ?? (item.category === "GASTOS_LOCALES"),
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
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
        totalUsd,
        totalPen,
        profitUsd,
        profitPen,
        modality: validated.modality || "IMPORTACIÓN MARÍTIMA",
        incoterm: validated.incoterm || null,
        origin: validated.origin || null,
        destination: validated.destination || null,
        shippingType: validated.shippingType || null,
        shippingLine: validated.shippingLine || null,
        frequency: validated.frequency || null,
        transitTime: validated.transitTime || null,
        cargoType: validated.cargoType || null,
        packagesCount: validated.packagesCount || null,
        grossWeight: validated.grossWeight || null,
        volume: validated.volume || null,
        loadType: validated.loadType || null,
        containersCount: validated.containersCount || null,
        notes: validated.notes || null,
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
