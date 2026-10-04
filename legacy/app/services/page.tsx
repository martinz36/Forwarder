import prisma from "@/lib/prisma";
import { ServicesCatalogManager } from "@/components/services-catalog-manager";
import { Tag } from "lucide-react";

export const metadata = {
  title: "Productos y Servicios | Forwarder ERP",
  description: "Gestión de catálogo de conceptos, servicios y tarifario pre-generado.",
};

export default async function ServicesPage() {
  const services = await prisma.conceptCatalog.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Catálogo de Productos y Servicios
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Administra los conceptos operativos pre-generados y tarifario maestro para cotización rápida.
          </p>
        </div>
      </div>

      <ServicesCatalogManager initialServices={services} />
    </div>
  );
}
