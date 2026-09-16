import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCompanyProfile } from "@/lib/company";
import { MasterClientPortal, MasterPortalOperation } from "@/components/master-client-portal";

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

  // Map operations linked to client's quotations
  const operations: MasterPortalOperation[] = client.quotations
    .filter((q) => q.operation !== null)
    .map((q) => {
      const op = q.operation!;

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
      operations={operations}
      companyName={companyProfile.tradeName}
    />
  );
}
