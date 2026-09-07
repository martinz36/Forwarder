import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cotizaciones de Carga y Aduana</h1>
          <p className="text-sm text-slate-500">Gestión de tarifas marítimas, aéreas y servicios aduaneros.</p>
        </div>
        <Button disabled className="bg-blue-600 text-white">Nueva Cotización</Button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
        <div className="rounded-full bg-purple-50 p-4 text-purple-600 mb-3">
          <FileText className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Módulo de Cotizaciones</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md">
          Las cotizaciones vinculadas a clientes e ítems están listas en la base de datos (Prisma Schema).
        </p>
      </div>
    </div>
  );
}
