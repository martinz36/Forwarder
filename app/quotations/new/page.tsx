import prisma from "@/lib/prisma";
import { QuotationForm } from "@/components/quotation-form";

export const dynamic = "force-dynamic";

interface NewQuotationPageProps {
  searchParams: Promise<{ expedientId?: string }>;
}

export default async function NewQuotationPage({ searchParams }: NewQuotationPageProps) {
  const { expedientId } = await searchParams;

  const [clients, concepts, expedient] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, businessName: true, documentNumber: true },
      orderBy: { businessName: "asc" },
    }),
    prisma.conceptCatalog.findMany({
      select: { id: true, name: true, category: true, defaultCurrency: true, defaultPrice: true, isTaxable: true },
      orderBy: { name: "asc" },
    }),
    expedientId
      ? prisma.expedient.findUnique({
          where: { id: expedientId },
          select: { id: true, clientId: true, code: true },
        })
      : null,
  ]);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <QuotationForm
        clients={clients}
        concepts={concepts}
        expedient={expedient}
      />
    </div>
  );
}
