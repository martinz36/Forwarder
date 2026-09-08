"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { quotationSchema, QuotationFormValues } from "@/lib/validations/quotation";

// Require pdf-parse to avoid ESM default import issues
const pdfParse = require("pdf-parse");

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

export async function parseQuotationPdfAction(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No se ha adjuntado ningún archivo PDF.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // pdf-parse extracts plain text
  const pdfData = await pdfParse(buffer);
  const text = pdfData.text || "";

  // 1. Extract Metadata using Regex
  const originMatch = text.match(/(?:Origen|ORIGEN)\s*:\s*([^\n\r]+)/i);
  const destMatch = text.match(/(?:Destino|DESTINO)\s*:\s*([^\n\r]+)/i);
  const incotermMatch = text.match(/(?:Incoterm|Tipo Flete\/cont|Tipo Flete)\s*:\s*([^\n\r]+)/i) || text.match(/\b(EXW|FOB|CFR|CIF|DDP|FCA)\b/i);
  const shippingTypeMatch = text.match(/(?:Tipo de Env[íi]o|Tipo Env[íi]o)\s*:\s*([^\n\r]+)/i);
  const shippingLineMatch = text.match(/(?:L[íi]nea Mar[íi]tima|L[íi]nea A[ée]rea|Carrier)\s*:\s*([^\n\r]+)/i);
  const frequencyMatch = text.match(/(?:Frecuencia)\s*:\s*([^\n\r]+)/i);
  const transitMatch = text.match(/(?:Tiempo de Transito|Tiempo Tr[áa]nsito|Transit Time)\s*:\s*([^\n\r]+)/i);
  const cargoTypeMatch = text.match(/(?:Producto|Tipo de Carga|Carga)\s*:\s*([^\n\r]+)/i);
  const packagesMatch = text.match(/(?:Bultos|Packages)\s*:\s*([^\n\r]+)/i);
  const weightMatch = text.match(/(?:Peso Bruto|Peso|Gross Weight)\s*:\s*([^\n\r]+)/i);
  const volumeMatch = text.match(/(?:Volumen|Volume|CBM)\s*:\s*([^\n\r]+)/i);
  const loadTypeMatch = text.match(/(?:Tipo Flete\/cont|Tipo Flete|FCL\/LCL|LCL\/LCL)\s*:\s*([^\n\r]+)/i);
  const containersMatch = text.match(/(?:Cant\. Contenedores|Contenedores)\s*:\s*([^\n\r]+)/i);
  const obsMatch = text.match(/(?:Observaciones|Notas|Conditions)\s*:\s*([\s\S]+?)(?=\n\n|\n[A-Z\s]{4,}:|$)/i);

  // 2. Line Items Parsing
  const items: Array<{
    description: string;
    category: "GASTOS_ORIGEN" | "FLETE_INTERNACIONAL" | "SEGURO" | "GASTOS_LOCALES";
    currency: "USD" | "PEN";
    unitCost: number;
    unitPrice: number;
    quantity: number;
    isTaxable: boolean;
  }> = [];

  const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  for (const line of lines) {
    if (
      /CONCEPTO|MONEDA|PRECIO UNIT|TOTAL GASTOS|TOTAL GENERAL|TOTAL A PAGAR|Señores|Estimados/i.test(line) &&
      !line.includes(":")
    ) {
      continue;
    }

    // Match line pattern
    const itemMatch =
      line.match(/^([A-Za-z0-9\/\.\s\-\_\(\)]+?)\s*(?::|\s)\s*(USD|PEN|S\/|\$)\s*([\d\.\,\s]+)$/i) ||
      line.match(/^([A-Za-z0-9\/\.\s\-\_\(\)]+?)\s+([\d\.\,]+)\s*(USD|PEN|S\/|\$)/i);

    if (itemMatch) {
      const rawDesc = itemMatch[1].trim();
      const rawCurr = itemMatch[2].trim().toUpperCase();
      const rawPrices = itemMatch[3]
        ? itemMatch[3].trim().split(/\s+/).map((p: string) => parseFloat(p.replace(/,/g, ""))).filter((n: number) => !isNaN(n))
        : [];

      if (rawDesc.length > 2 && rawPrices.length > 0) {
        const unitCost = rawPrices[0];
        const currency: "USD" | "PEN" = rawCurr.includes("PEN") || rawCurr.includes("S/") ? "PEN" : "USD";

        let category: "GASTOS_ORIGEN" | "FLETE_INTERNACIONAL" | "SEGURO" | "GASTOS_LOCALES" = "GASTOS_LOCALES";
        let isTaxable = true;

        const descUpper = rawDesc.toUpperCase();

        if (/EXW|ORIGEN|PICKUP|INLAND|PICK UP|ORIGIN|FOB CHARGES|DOC FEE/i.test(descUpper)) {
          category = "GASTOS_ORIGEN";
          isTaxable = false;
        } else if (/FLETE|FREIGHT|OCEAN|AIR|MARITIMO|TON\/M3|BAF|THC|ZARPE/i.test(descUpper)) {
          category = "FLETE_INTERNACIONAL";
          isTaxable = false;
        } else if (/SEGURO|INSURANCE|POLICY/i.test(descUpper)) {
          category = "SEGURO";
          isTaxable = false;
        } else {
          category = "GASTOS_LOCALES";
          isTaxable = !/INAFECTO|REEMBOLSO/i.test(descUpper);
        }

        const unitPrice = Number((unitCost * 1.15).toFixed(2));

        items.push({
          description: rawDesc,
          category,
          currency,
          unitCost,
          unitPrice,
          quantity: 1,
          isTaxable,
        });
      }
    }
  }

  return {
    metadata: {
      origin: originMatch ? originMatch[1].trim() : "",
      destination: destMatch ? destMatch[1].trim() : "",
      incoterm: incotermMatch ? incotermMatch[1].trim() : "",
      shippingType: shippingTypeMatch ? shippingTypeMatch[1].trim() : "",
      shippingLine: shippingLineMatch ? shippingLineMatch[1].trim() : "",
      frequency: frequencyMatch ? frequencyMatch[1].trim() : "",
      transitTime: transitMatch ? transitMatch[1].trim() : "",
      cargoType: cargoTypeMatch ? cargoTypeMatch[1].trim() : "",
      packagesCount: packagesMatch ? packagesMatch[1].trim() : "",
      grossWeight: weightMatch ? weightMatch[1].trim() : "",
      volume: volumeMatch ? volumeMatch[1].trim() : "",
      loadType: loadTypeMatch ? loadTypeMatch[1].trim() : "",
      containersCount: containersMatch ? containersMatch[1].trim() : "",
      notes: obsMatch ? obsMatch[1].trim() : "",
    },
    items,
    rawTextLength: text.length,
  };
}
