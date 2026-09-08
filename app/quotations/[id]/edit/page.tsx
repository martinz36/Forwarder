import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { QuotationForm } from "@/components/quotation-form";

export const dynamic = "force-dynamic";

interface EditQuotationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { id } = await params;

  const [quotation, clients, concepts] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
      },
    }),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, businessName: true, documentNumber: true },
      orderBy: { businessName: "asc" },
    }),
    prisma.conceptCatalog.findMany({
      select: { id: true, name: true, defaultCurrency: true, defaultPrice: true, isTaxable: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!quotation) {
    notFound();
  }

  const initialData = {
    id: quotation.id,
    code: quotation.code,
    clientId: quotation.clientId,
    validUntil: quotation.validUntil ? quotation.validUntil.toISOString().split("T")[0] : "",
    items: quotation.items.map((item) => ({
      description: item.description,
      currency: item.currency as "USD" | "PEN",
      unitCost: item.unitCost,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      isTaxable: item.isTaxable,
    })),
  };

  return (
    <div className="w-full px-4 sm:px-6 space-y-6">
      <QuotationForm clients={clients} concepts={concepts} initialData={initialData} />
    </div>
  );
}
