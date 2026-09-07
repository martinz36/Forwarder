import { Ship } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operaciones y Despachos Aduaneros</h1>
          <p className="text-sm text-slate-500">Seguimiento de embarques (FCL/LCL/Aéreo), DUA/DAM y levante.</p>
        </div>
        <Button disabled className="bg-blue-600 text-white">Nueva Operación</Button>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-center shadow-sm">
        <div className="rounded-full bg-amber-50 p-4 text-amber-600 mb-3">
          <Ship className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Módulo de Operaciones</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md">
          Próximamente seguimiento de DAM / Levante aduanero y contenedores.
        </p>
      </div>
    </div>
  );
}
