import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
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
        include: { client: true },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!operation) {
    notFound();
  }

  return (
    <ClientDocumentPortal
      operationId={operation.id}
      token={token}
      operationCode={operation.quotation.code}
      clientName={operation.quotation.client.businessName}
      blNumber={operation.blNumber}
      etd={operation.etd}
      eta={operation.eta}
      status={operation.status}
      customsChannel={operation.customsChannel}
      documents={operation.documents}
    />
  );
}
