import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { buildQuotationPdfData } from "@/lib/quotation-pdf-helper";
import { ClientDocumentPortal } from "@/components/client-document-portal";

export const dynamic = "force-dynamic";

interface SharedPortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedPortalPage({ params }: SharedPortalPageProps) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const operation = await prisma.operation.findUnique({
    where: { sharedToken: token },
    include: {
      quotation: {
        include: {
          client: true,
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      documents: {
        where: {
          OR: [
            { uploadedBy: "CLIENT" },
            { uploadedBy: "BROKER", isPublic: true },
          ],
        },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!operation) {
    notFound();
  }

  const q = operation.quotation;

  const quotationPdfData = buildQuotationPdfData({
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
      businessName: q.client.businessName,
      documentType: q.client.documentType,
      documentNumber: q.client.documentNumber,
      email: q.client.email,
      phone: q.client.phone,
      address: q.client.address,
    },
    items: q.items.map((i) => ({
      description: i.description,
      category: i.category,
      currency: i.currency,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      total: i.total,
      isTaxable: i.isTaxable,
    })),
  });

  return (
    <ClientDocumentPortal
      operationId={operation.id}
      token={token}
      operationCode={q.code}
      clientName={q.client.businessName}
      blNumber={operation.blNumber}
      etd={operation.etd}
      eta={operation.eta}
      status={operation.status}
      customsChannel={operation.customsChannel}
      documents={operation.documents}
      quotationPdfData={quotationPdfData}
      quotationTotalUsd={q.totalUsd}
      quotationTotalPen={q.totalPen}
    />
  );
}
