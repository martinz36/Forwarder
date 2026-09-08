import { prisma } from "@/lib/prisma";

export interface SunatEmitResult {
  success: boolean;
  invoiceNumber?: string;
  cdrStatus: "ACCEPTED" | "REJECTED";
  pdfUrl?: string;
  notes?: string;
  payloadSent?: Record<string, unknown>;
}

/**
 * Simulates calling an external SUNAT / PSE Electronic Invoicing API (e.g. NubeFact / Facturactiva)
 */
export async function emitirComprobanteMock(liquidationId: string): Promise<SunatEmitResult> {
  const liquidation = await prisma.liquidation.findUnique({
    where: { id: liquidationId },
    include: {
      operation: {
        include: {
          quotation: {
            include: {
              client: true,
            },
          },
          charges: true,
        },
      },
    },
  });

  if (!liquidation) {
    throw new Error("Liquidación no encontrada.");
  }

  const client = liquidation.operation.quotation.client;
  const taxableCharges = liquidation.operation.charges.filter((c) => c.isTaxable);

  // Structure mock SUNAT electronic invoice JSON payload (Tipo 01 - Factura Electrónica)
  const payloadSent = {
    operacion: "generar_comprobante",
    tipo_de_comprobante: 1, // 1 = Factura
    serie: "F001",
    numero: Math.floor(1000 + Math.random() * 9000),
    cliente_tipo_de_documento: client.documentType === "RUC" ? 6 : 1,
    cliente_numero_de_documento: client.documentNumber,
    cliente_denominacion: client.businessName,
    cliente_email: client.email || "cliente@ejemplo.com",
    fecha_de_emision: new Date().toISOString().split("T")[0],
    moneda: "USD",
    porcentaje_igv: 18.0,
    total_gravada: liquidation.subtotalTaxableUsd,
    total_igv: liquidation.igvUsd,
    total_inafecta: liquidation.totalNonTaxableUsd,
    total: liquidation.grandTotalUsd,
    items: taxableCharges.map((item) => ({
      unidad_de_medida: "ZZ",
      descripcion: item.description,
      cantidad: item.quantity,
      valor_unitario: item.unitPrice,
      precio_unitario: Number((item.unitPrice * 1.18).toFixed(2)),
      subtotal: Number((item.unitPrice * item.quantity).toFixed(2)),
      tipo_de_igv: 1, // Gravado - Operación Onerosa
      igv: Number((item.unitPrice * item.quantity * 0.18).toFixed(2)),
      total: Number((item.unitPrice * item.quantity * 1.18).toFixed(2)),
    })),
  };

  // Simulate network latency to PSE/SUNAT API (2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Generate mock series + invoice number (e.g. F001-000452)
  const randomCorrelative = String(Math.floor(100 + Math.random() * 900)).padStart(6, "0");
  const invoiceNumber = `F001-${randomCorrelative}`;

  // Mock PDF URL for demonstration
  const pdfUrl = `https://www.w3.org/W3C/DesignIssues/PDF.pdf`;

  console.log("SUNAT API Payload Sent:", JSON.stringify(payloadSent, null, 2));

  return {
    success: true,
    invoiceNumber,
    cdrStatus: "ACCEPTED",
    pdfUrl,
    notes: "Comprobante electrónico aceptado exitosamente por SUNAT.",
    payloadSent,
  };
}
