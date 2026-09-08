"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractText } from "unpdf";
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
        expedientId: validated.expedientId || null,
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
        etd: validated.etd || null,
        eta: validated.eta || null,
        blNro: validated.blNro || null,
        shipper: validated.shipper || null,
        mercaderia: validated.mercaderia || null,
        formaPago: validated.formaPago || null,
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

  // Extract text safely using unpdf (pure JS, zero native C++ bindings, 100% serverless safe)
  const { text: textPages } = await extractText(arrayBuffer);
  const text = Array.isArray(textPages) ? textPages.join("\n") : textPages || "";

  // 1. Extract Metadata matching exact Pre-Alerta Header Labels from PDF
  const originMatch = text.match(/(?:LUG\.\s*EMBARQUE|LUGAR EMBARQUE|ORIGEN)\s*:\s*([^\n\r]+)/i);
  const naveMatch = text.match(/(?:NAVE|VESSEL|L[Íi]NEA MAR[Íi]TIMA)\s*:\s*([^\n\r]+)/i);
  const etdMatch = text.match(/(?:E\.T\.D|ETD)\s*:\s*([^\n\r]+)/i);
  const etaMatch = text.match(/(?:E\.T\.A|ETA)\s*:\s*([^\n\r]+)/i);
  const blMatch = text.match(/(?:BL\/Nro|BL\/NRO|BL NRO|HBL|BL)\s*:\s*([^\n\r]+)/i);
  const bultosMatch = text.match(/(?:BULTOS|PALETA|PACKAGES)\s*:\s*([^\n\r]+)/i);
  const pesoVolMatch = text.match(/(?:PESO\s*&\s*VOL\.|PESO Y VOL\.|PESO|VOLUMEN)\s*:\s*([^\n\r]+)/i);
  const shipperMatch = text.match(/(?:SHIPPER|PROVEEDOR)\s*:\s*([^\n\r]+)/i);
  const mercaderiaMatch = text.match(/(?:MERCADERIA|MERCADER[IÍ]A)\s*:\s*([^\n\r]+)/i);
  const formaPagoMatch = text.match(/(?:FORMA DE PAGO|FORMA PAGO|PAGO)\s*:\s*([^\n\r]+)/i);
  const incotermMatch = text.match(/(?:Incoterm|MODALIDAD)\s*:\s*([^\n\r]+)/i) || text.match(/\b(EXW|FOB|CFR|CIF|DDP|FCA)\b/i);

  // Separate Peso & Vol if combined (e.g. "0.96 Ton")
  let grossWeight = "";
  let volume = "";
  if (pesoVolMatch) {
    const rawPV = pesoVolMatch[1].trim();
    if (rawPV.includes("/")) {
      const parts = rawPV.split("/");
      grossWeight = parts[0].trim();
      volume = parts[1].trim();
    } else {
      grossWeight = rawPV;
    }
  }

  // Clean ETA (e.g. strip trailing "Hora:")
  const rawEta = etaMatch ? etaMatch[1].replace(/\s*Hora:.*/i, "").trim() : "";

  // 2. Line Items Parsing with Section Context Tracking
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

  let currentCategoryContext: "GASTOS_ORIGEN" | "GASTOS_LOCALES" | null = null;

  for (const line of lines) {
    const upperLine = line.toUpperCase();

    // Check section header changes
    if (upperLine.includes("GASTOS DE ORIGEN")) {
      currentCategoryContext = "GASTOS_ORIGEN";
      continue;
    } else if (upperLine.includes("GASTOS DE DESTINO") || upperLine.includes("GASTOS LOCALES")) {
      currentCategoryContext = "GASTOS_LOCALES";
      continue;
    }

    if (
      /CONCEPTO|MONEDA|PRECIO UNIT|TOTAL GASTOS|TOTAL GENERAL|TOTAL A PAGAR|TOTAL:|MONTOS A PAGAR|PRE-ALERTA/i.test(line) &&
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

        if (currentCategoryContext === "GASTOS_ORIGEN") {
          if (/FLETE|FREIGHT|OCEAN|AIR|MARITIMO|TON\/M3|BAF/i.test(descUpper)) {
            category = "FLETE_INTERNACIONAL";
          } else if (/SEGURO|INSURANCE/i.test(descUpper)) {
            category = "SEGURO";
          } else {
            category = "GASTOS_ORIGEN";
          }
          isTaxable = false;
        } else if (currentCategoryContext === "GASTOS_LOCALES") {
          category = "GASTOS_LOCALES";
          isTaxable = true;
        } else {
          // Heuristic fallback
          if (/EXW|ORIGEN|PICKUP|INLAND|ORIGIN|DOC FEE/i.test(descUpper)) {
            category = "GASTOS_ORIGEN";
            isTaxable = false;
          } else if (/FLETE|FREIGHT|OCEAN|AIR|TON\/M3/i.test(descUpper)) {
            category = "FLETE_INTERNACIONAL";
            isTaxable = false;
          } else if (/SEGURO|INSURANCE/i.test(descUpper)) {
            category = "SEGURO";
            isTaxable = false;
          } else {
            category = "GASTOS_LOCALES";
            isTaxable = true;
          }
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
      destination: "CALLAO - PERU",
      incoterm: incotermMatch ? incotermMatch[1].trim() : "EXW",
      shippingType: "Directo",
      shippingLine: naveMatch ? naveMatch[1].trim() : "",
      frequency: "SEMANAL",
      transitTime: etdMatch && etaMatch ? `ETD: ${etdMatch[1].trim()} - ETA: ${rawEta}` : "",
      etd: etdMatch ? etdMatch[1].trim() : "",
      eta: rawEta,
      blNro: blMatch ? blMatch[1].trim() : "",
      shipper: shipperMatch ? shipperMatch[1].trim() : "",
      mercaderia: mercaderiaMatch ? mercaderiaMatch[1].trim() : "",
      formaPago: formaPagoMatch ? formaPagoMatch[1].trim() : "CONTADO",
      cargoType: mercaderiaMatch ? mercaderiaMatch[1].trim() : "CARGA GENERAL",
      packagesCount: bultosMatch ? bultosMatch[1].trim() : "",
      grossWeight: grossWeight || "",
      volume: volume || "",
      loadType: "LCL / LCL",
      containersCount: "",
      notes: "- TARIFA HASTA 5 CBM, EN CASO DE SUPERAR SE VOLVERÁ A COTIZAR.\n- VERIFICAR LA TARIFA VIGENTE SEGÚN FECHA DE ZARPE.",
    },
    items,
    rawTextLength: text.length,
  };
}

export async function deleteQuotationAction(quotationId: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { clientId: true },
  });

  if (!quotation) {
    throw new Error("La cotización no existe.");
  }

  await prisma.quotation.delete({
    where: { id: quotationId },
  });

  revalidatePath("/quotations");
  revalidatePath("/");
  if (quotation.clientId) {
    revalidatePath(`/clients/${quotation.clientId}`);
  }
}
