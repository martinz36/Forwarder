import prisma from "@/lib/prisma";
import { QuotationForm } from "@/components/quotation-form";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const [clients, concepts] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.conceptCatalog.findMany({
      select: { id: true, name: true, defaultCurrency: true, defaultPrice: true, isTaxable: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <QuotationForm clients={clients} concepts={concepts} />
    </div>
  );
}
