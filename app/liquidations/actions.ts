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

export async function emitInvoiceAction(liquidationId: string) {
  const { emitirComprobanteMock } = await import("@/lib/sunat");

  const liquidation = await prisma.liquidation.findUnique({
    where: { id: liquidationId },
    select: { operationId: true, status: true },
  });

  if (!liquidation) {
    throw new Error("Liquidación no encontrada.");
  }

  // Call SUNAT mock PSE service
  const result = await emitirComprobanteMock(liquidationId);

  if (!result.success || !result.invoiceNumber) {
    throw new Error(result.notes || "Error al emitir el comprobante en SUNAT.");
  }

  // Update liquidation status and SUNAT details
  const updatedLiquidation = await prisma.liquidation.update({
    where: { id: liquidationId },
    data: {
      status: "BILLED",
      invoiceNumber: result.invoiceNumber,
      sunatPdfUrl: result.pdfUrl,
      sunatCdrStatus: result.cdrStatus,
      sunatNotes: result.notes,
    },
  });

  // Automatically insert invoice PDF document into Operation Shared Portal
  if (result.pdfUrl) {
    const existingDoc = await prisma.document.findFirst({
      where: {
        operationId: liquidation.operationId,
        name: { contains: result.invoiceNumber },
      },
    });

    if (!existingDoc) {
      await prisma.document.create({
        data: {
          operationId: liquidation.operationId,
          name: `Factura Electrónica SUNAT (${result.invoiceNumber})`,
          fileUrl: result.pdfUrl,
          documentType: "LIQUIDACION",
          uploadedBy: "BROKER",
        },
      });
    }

    // Also mark operation status as LIQUIDADO
    await prisma.operation.update({
      where: { id: liquidation.operationId },
      data: { status: "LIQUIDADO" },
    });
  }

  const operation = await prisma.operation.findUnique({
    where: { id: liquidation.operationId },
    include: { quotation: true },
  });

  revalidatePath(`/liquidations/${liquidationId}`);
  revalidatePath(`/operations/${liquidation.operationId}`);
  if (operation?.quotation?.clientId) {
    revalidatePath(`/clients/${operation.quotation.clientId}`);
  }

  return {
    success: true,
    invoiceNumber: result.invoiceNumber,
    pdfUrl: result.pdfUrl,
    cdrStatus: result.cdrStatus,
  };
}

export async function generateReceiptAction(liquidationId: string) {
  const liquidation = await prisma.liquidation.findUnique({
    where: { id: liquidationId },
    select: { operationId: true, receiptNumber: true },
  });

  if (!liquidation) {
    throw new Error("Liquidación no encontrada.");
  }

  if (liquidation.receiptNumber) {
    return { success: true, receiptNumber: liquidation.receiptNumber };
  }

  // Generate internal receipt correlative code: e.g. REC-2026-000123
  const count = await prisma.liquidation.count({
    where: { receiptNumber: { not: null } },
  });
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(6, "0");
  const receiptNumber = `REC-${year}-${sequence}`;

  await prisma.liquidation.update({
    where: { id: liquidationId },
    data: {
      receiptNumber,
      receiptGeneratedAt: new Date(),
    },
  });

  // Automatically register Recibo Interno in Operation Document Repository
  const existingDoc = await prisma.document.findFirst({
    where: {
      operationId: liquidation.operationId,
      name: { contains: receiptNumber },
    },
  });

  if (!existingDoc) {
    await prisma.document.create({
      data: {
        operationId: liquidation.operationId,
        name: `Recibo Interno de Reembolso (${receiptNumber})`,
        fileUrl: `/liquidations/${liquidationId}`,
        documentType: "LIQUIDACION",
        uploadedBy: "BROKER",
      },
    });
  }

  const operation = await prisma.operation.findUnique({
    where: { id: liquidation.operationId },
    include: { quotation: true },
  });

  revalidatePath(`/liquidations/${liquidationId}`);
  revalidatePath(`/operations/${liquidation.operationId}`);
  if (operation?.quotation?.clientId) {
    revalidatePath(`/clients/${operation.quotation.clientId}`);
  }

  return { success: true, receiptNumber };
}

