"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function toggleChargeTaxableAction(
  chargeId: string,
  isTaxable: boolean,
  operationId: string
) {
  await prisma.operationCharge.update({
    where: { id: chargeId },
    data: { isTaxable },
  });

  revalidatePath(`/operations/${operationId}`);
}

export async function generateLiquidationAction(operationId: string) {
  if (!operationId) {
    throw new Error("ID de operación no válido.");
  }

  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    include: { charges: true },
  });

  if (!operation) {
    throw new Error("La operación especificada no existe.");
  }

  // Calculate IGV (18%) and subtotals on server for USD & PEN
  let subtotalTaxableUsd = 0;
  let totalNonTaxableUsd = 0;

  let subtotalTaxablePen = 0;
  let totalNonTaxablePen = 0;

  operation.charges.forEach((charge) => {
    const salePrice = charge.totalPrice;
    if (charge.currency === "PEN") {
      if (charge.isTaxable) {
        subtotalTaxablePen += salePrice;
      } else {
        totalNonTaxablePen += salePrice;
      }
    } else {
      if (charge.isTaxable) {
        subtotalTaxableUsd += salePrice;
      } else {
        totalNonTaxableUsd += salePrice;
      }
    }
  });

  // Precise server 18% IGV calculations
  subtotalTaxableUsd = Number(subtotalTaxableUsd.toFixed(2));
  const igvUsd = Number((subtotalTaxableUsd * 0.18).toFixed(2));
  const totalTaxableUsd = Number((subtotalTaxableUsd + igvUsd).toFixed(2));
  totalNonTaxableUsd = Number(totalNonTaxableUsd.toFixed(2));
  const grandTotalUsd = Number((totalTaxableUsd + totalNonTaxableUsd).toFixed(2));

  subtotalTaxablePen = Number(subtotalTaxablePen.toFixed(2));
  const igvPen = Number((subtotalTaxablePen * 0.18).toFixed(2));
  const totalTaxablePen = Number((subtotalTaxablePen + igvPen).toFixed(2));
  totalNonTaxablePen = Number(totalNonTaxablePen.toFixed(2));
  const grandTotalPen = Number((totalTaxablePen + totalNonTaxablePen).toFixed(2));

  // Upsert Liquidation record in Neon DB
  const liquidation = await prisma.liquidation.upsert({
    where: { operationId },
    update: {
      subtotalTaxableUsd,
      igvUsd,
      totalTaxableUsd,
      totalNonTaxableUsd,
      grandTotalUsd,
      subtotalTaxablePen,
      igvPen,
      totalTaxablePen,
      totalNonTaxablePen,
      grandTotalPen,
      status: "DRAFT",
    },
    create: {
      operationId,
      subtotalTaxableUsd,
      igvUsd,
      totalTaxableUsd,
      totalNonTaxableUsd,
      grandTotalUsd,
      subtotalTaxablePen,
      igvPen,
      totalTaxablePen,
      totalNonTaxablePen,
      grandTotalPen,
      status: "DRAFT",
    },
  });

  revalidatePath(`/operations/${operationId}`);
  revalidatePath(`/liquidations/${liquidation.id}`);
  redirect(`/liquidations/${liquidation.id}`);
}
