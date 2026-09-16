import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCompanyProfile } from "@/lib/company";
import { buildQuotationPdfData } from "@/lib/quotation-pdf-helper";
import { MasterClientPortal, MasterPortalOperation, MasterPortalQuotation } from "@/components/master-client-portal";

export const dynamic = "force-dynamic";

interface PortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function MasterPortalPage({ params }: PortalPageProps) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const [client, companyProfile] = await Promise.all([
    prisma.client.findUnique({
      where: { portalToken: token },
      include: {
        quotations: {
          include: {
            items: {
              orderBy: { createdAt: "asc" },
            },
            operation: {
              include: {
                charges: true,
                paymentRecords: true,
                liquidation: true,
                documents: {
                  where: {
                    OR: [
                      { uploadedBy: "CLIENT" },
                      { uploadedBy: "BROKER", isPublic: true },
                    ],
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getCompanyProfile(),
  ]);

  if (!client) {
    notFound();
  }

  // Map all Quotations for this Client
  const quotationsList: MasterPortalQuotation[] = client.quotations.map((q) => {
    const pdfData = buildQuotationPdfData({
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
        businessName: client.businessName,
        documentType: client.documentType,
        documentNumber: client.documentNumber,
        email: client.email,
        phone: client.phone,
        address: client.address,
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

    return {
      id: q.id,
      code: q.code,
      status: q.status,
      createdAt: q.createdAt,
      totalUsd: q.totalUsd,
      totalPen: q.totalPen,
      pdfData,
      operationId: q.operation?.id,
      operationStatus: q.operation?.status,
      sharedToken: q.operation?.sharedToken,
    };
  });

  // Map Operations linked to client's quotations
  const operationsList: MasterPortalOperation[] = client.quotations
    .filter((q) => q.operation !== null)
    .map((q) => {
      const op = q.operation!;

      const pdfData = buildQuotationPdfData({
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
          businessName: client.businessName,
          documentType: client.documentType,
          documentNumber: client.documentNumber,
          email: client.email,
          phone: client.phone,
          address: client.address,
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

      // Calculate total charges by currency
      let totalChargesUsd = 0;
      let totalChargesPen = 0;

      op.charges.forEach((c) => {
        if (c.currency === "PEN") {
          totalChargesPen += c.totalPrice;
        } else {
          totalChargesUsd += c.totalPrice;
        }
      });

      // Calculate total payments received by currency
      let totalPaidUsd = 0;
      let totalPaidPen = 0;

      op.paymentRecords.forEach((p) => {
        if (p.currency === "PEN") {
          totalPaidPen += p.amount;
        } else {
          totalPaidUsd += p.amount;
        }
      });

      return {
        id: op.id,
        quotationCode: q.code,
        quotationTotalUsd: q.totalUsd,
        quotationTotalPen: q.totalPen,
        quotationPdfData: pdfData,
        blNumber: op.blNumber,
        status: op.status,
        incoterm: op.incoterm || q.incoterm,
        modality: q.modality,
        origin: q.origin,
        destination: q.destination,
        cargoType: q.cargoType,
        etd: op.etd,
        eta: op.eta,
        customsChannel: op.customsChannel,
        sharedToken: op.sharedToken,
        hblApproved: op.hblApproved,
        customsDocsSent: op.customsDocsSent,
        taxesPaid: op.taxesPaid,
        transportDocsSent: op.transportDocsSent,
        cargoDelivered: op.cargoDelivered,
        createdAt: op.createdAt,
        documentsCount: op.documents.length,
        totalChargesUsd,
        totalChargesPen,
        totalPaidUsd,
        totalPaidPen,
        liquidationStatus: op.liquidation?.status,
        liquidationGrandTotalUsd: op.liquidation?.grandTotalUsd,
        liquidationGrandTotalPen: op.liquidation?.grandTotalPen,
      };
    });

  return (
    <MasterClientPortal
      clientName={client.businessName}
      documentType={client.documentType}
      documentNumber={client.documentNumber}
      contactName={client.contactName}
      email={client.email}
      phone={client.phone}
      operations={operationsList}
      quotations={quotationsList}
      companyName={companyProfile.tradeName}
    />
  );
}
