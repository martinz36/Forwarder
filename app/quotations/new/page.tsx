import prisma from "@/lib/prisma";
import { QuotationForm } from "@/components/quotation-form";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const [clients, concepts] = await Promise.all([
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

  return (
    <div className="w-full px-4 sm:px-6 space-y-6">
      <QuotationForm clients={clients} concepts={concepts} />
    </div>
  );
}
