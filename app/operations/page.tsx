import prisma from "@/lib/prisma";
import { OperationsTableView } from "@/components/operations-table-view";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const operations = await prisma.operation.findMany({
    include: {
      quotation: {
        include: { client: true },
      },
      charges: true,
      liquidation: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Panel de Control Operativo
          </h1>
          <p className="text-sm text-slate-500">
            Seguimiento de despachos aduaneros, canal de aduana (Verde/Naranja/Rojo) y control financiero de sobrecostos.
          </p>
        </div>
      </div>

      {/* Interactive Table View */}
      <OperationsTableView operations={operations as any} />
    </div>
  );
}
