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

  // Process items and calculate totals by currency
  let totalUsd = 0;
  let totalPen = 0;

  const itemsWithTotal = validated.items.map((item) => {
    const total = Number((item.unitPrice * item.quantity).toFixed(2));
    if (item.currency === "USD") {
      totalUsd += total;
    } else {
      totalPen += total;
    }

    return {
      description: item.description.trim(),
      currency: item.currency,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total,
    };
  });

  totalUsd = Number(totalUsd.toFixed(2));
  totalPen = Number(totalPen.toFixed(2));

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
