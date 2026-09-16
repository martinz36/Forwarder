import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { QuotationForm } from "@/components/quotation-form";

export const dynamic = "force-dynamic";

interface EditQuotationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: true,
      expedient: true,
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  const [clients, concepts] = await Promise.all([
    prisma.client.findMany({
      select: {
        id: true,
        businessName: true,
        documentNumber: true,
      },
      orderBy: { businessName: "asc" },
    }),
    prisma.conceptCatalog.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        defaultCurrency: true,
        defaultCost: true,
        defaultPrice: true,
        isTaxable: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialData = {
    clientId: quotation.clientId,
    expedientId: quotation.expedientId || "",
    validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split("T")[0] : "",
    modality: quotation.modality || "IMPORTACIÓN MARÍTIMA",
    incoterm: quotation.incoterm || "",
    origin: quotation.origin || "",
    destination: quotation.destination || "",
    shippingType: quotation.shippingType || "",
    shippingLine: quotation.shippingLine || "",
    frequency: quotation.frequency || "",
    transitTime: quotation.transitTime || "",
    etd: quotation.etd || "",
    eta: quotation.eta || "",
    blNro: quotation.blNro || "",
    shipper: quotation.shipper || "",
    mercaderia: quotation.mercaderia || "",
    formaPago: quotation.formaPago || "",
    cargoType: quotation.cargoType || "",
    packagesCount: quotation.packagesCount || "",
    grossWeight: quotation.grossWeight || "",
    volume: quotation.volume || "",
    loadType: quotation.loadType || "",
    containersCount: quotation.containersCount || "",
    polId: quotation.polId || "",
    podId: quotation.podId || "",
    shipperId: quotation.shipperId || "",
    carrierId: quotation.carrierId || "",
    notes: quotation.notes || "",
    items: quotation.items.map((item) => ({
      description: item.description,
      category: (item.category as any) || "GASTOS_LOCALES",
      currency: (item.currency as any) || "USD",
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      isTaxable: item.isTaxable,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      <QuotationForm
        clients={clients}
        concepts={concepts}
        quotationId={quotation.id}
        quotationCode={quotation.code}
        initialData={initialData}
        expedient={quotation.expedient ? { id: quotation.expedient.id, clientId: quotation.expedient.clientId, code: quotation.expedient.code } : null}
      />
    </div>
  );
}
