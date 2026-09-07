"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, Ship, ShieldAlert, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOperationHeaderAction } from "@/app/operations/actions";

interface OperationHeaderFormProps {
  operationId: string;
  initialData: {
    status: "EN_TRANSITO" | "EN_ADUANA" | "RETIRADO" | "LIQUIDADO";
    blNumber?: string | null;
    etd?: Date | null;
    eta?: Date | null;
    customsChannel?: "VERDE" | "NARANJA" | "ROJO" | null;
  };
}

export function OperationHeaderForm({ operationId, initialData }: OperationHeaderFormProps) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const defaultEtd = initialData.etd ? new Date(initialData.etd).toISOString().split("T")[0] : "";
  const defaultEta = initialData.eta ? new Date(initialData.eta).toISOString().split("T")[0] : "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMsg(null);
    const formData = new FormData(event.currentTarget);

    const status = formData.get("status") as any;
    const blNumber = formData.get("blNumber") as string;
    const etd = formData.get("etd") as string;
    const eta = formData.get("eta") as string;
    const customsChannel = formData.get("customsChannel") as any;

    startTransition(async () => {
      try {
        await updateOperationHeaderAction(operationId, {
          status,
          blNumber,
          etd,
          eta,
          customsChannel,
        });
        setSuccessMsg("Datos operativos actualizados correctamente.");
      } catch (err: any) {
        alert(err.message || "Error al actualizar la operación.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Ship className="h-5 w-5 text-blue-600" /> Control de Despacho & Seguimiento
        </h2>
        {successMsg && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            ✓ {successMsg}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs font-semibold text-slate-700">Estado Operativo</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialData.status}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="EN_TRANSITO">EN TRÁNSITO</option>
            <option value="EN_ADUANA">EN ADUANA</option>
            <option value="RETIRADO">RETIRADO</option>
            <option value="LIQUIDADO">LIQUIDADO</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="blNumber" className="text-xs font-semibold text-slate-700">BL / HBL / Guía</Label>
          <Input
            id="blNumber"
            name="blNumber"
            placeholder="Ej: MEDU1234567"
            defaultValue={initialData.blNumber || ""}
            className="h-9 text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="etd" className="text-xs font-semibold text-slate-700">ETD (Salida Origen)</Label>
          <Input id="etd" name="etd" type="date" defaultValue={defaultEtd} className="h-9 text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="eta" className="text-xs font-semibold text-slate-700">ETA (Llegada Callao)</Label>
          <Input id="eta" name="eta" type="date" defaultValue={defaultEta} className="h-9 text-xs" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="customsChannel" className="text-xs font-semibold text-slate-700">Canal de Aduana</Label>
          <select
            id="customsChannel"
            name="customsChannel"
            defaultValue={initialData.customsChannel || ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Por Asignar</option>
            <option value="VERDE">🟢 CANAL VERDE (Levante Automático)</option>
            <option value="NARANJA">🟡 CANAL NARANJA (Revisión Documentaria)</option>
            <option value="ROJO">🔴 CANAL ROJO (Aforo Físico)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" /> Actualizar Datos
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
