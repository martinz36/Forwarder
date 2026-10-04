import { QuotationPdfData } from "@/components/pdf/quotation-pdf";

export interface FullQuotationForPdf {
  code: string;
  createdAt: Date | string;
  validUntil?: Date | string | null;
  modality?: string | null;
  incoterm?: string | null;
  origin?: string | null;
  destination?: string | null;
  shippingType?: string | null;
  shippingLine?: string | null;
  frequency?: string | null;
  transitTime?: string | null;
  etd?: string | null;
  eta?: string | null;
  blNro?: string | null;
  shipper?: string | null;
  mercaderia?: string | null;
  formaPago?: string | null;
  cargoType?: string | null;
  packagesCount?: string | null;
  grossWeight?: string | null;
  volume?: string | null;
  loadType?: string | null;
  containersCount?: string | null;
  notes?: string | null;
  client: {
    businessName: string;
    documentType?: string | null;
    documentNumber?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    description: string;
    category?: string | null;
    currency: string;
    unitPrice: number;
    quantity: number;
    total: number;
    isTaxable: boolean;
  }>;
}

export function buildQuotationPdfData(q: FullQuotationForPdf): QuotationPdfData {
  let subtotalTaxableUsd = 0;
  let totalNonTaxableUsd = 0;
  let subtotalTaxablePen = 0;
  let totalNonTaxablePen = 0;

  q.items.forEach((item) => {
    if (item.currency === "PEN") {
      if (item.isTaxable) subtotalTaxablePen += item.total;
      else totalNonTaxablePen += item.total;
    } else {
      if (item.isTaxable) subtotalTaxableUsd += item.total;
      else totalNonTaxableUsd += item.total;
    }
  });

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

  return {
    code: q.code,
    createdAt: q.createdAt,
    validUntil: q.validUntil,
    modality: q.modality,
    incoterm: q.incoterm,
    origin: q.origin,
    destination: q.destination,
    shippingType: q.shippingType,
    shippingLine: q.shippingLine,
    frequency: q.frequency,
    transitTime: q.transitTime,
    etd: q.etd,
    eta: q.eta,
    blNro: q.blNro,
    shipper: q.shipper,
    mercaderia: q.mercaderia,
    formaPago: q.formaPago,
    cargoType: q.cargoType,
    packagesCount: q.packagesCount,
    grossWeight: q.grossWeight,
    volume: q.volume,
    loadType: q.loadType,
    containersCount: q.containersCount,
    notes: q.notes,
    client: {
      name: q.client.businessName,
      documentType: q.client.documentType,
      documentNumber: q.client.documentNumber,
      email: q.client.email,
      phone: q.client.phone,
      address: q.client.address,
    },
    items: q.items.map((i) => ({
      description: i.description,
      category: i.category ?? undefined,
      currency: i.currency,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      total: i.total,
      isTaxable: i.isTaxable,
    })),
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
  };
}
