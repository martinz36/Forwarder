"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, Ship, ShieldAlert, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOperationHeaderAction } from "@/app/operations/actions";

import { ThreeColumnDatePicker } from "@/components/ui/three-column-date-picker";

import { OFFICIAL_INCOTERMS } from "@/lib/constants";

interface OperationHeaderFormProps {
  operationId: string;
  initialData: {
    status: string;
    incoterm?: string | null;
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

  const [etdValue, setEtdValue] = useState<string>(defaultEtd);
  const [etaValue, setEtaValue] = useState<string>(defaultEta);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMsg(null);
    const formData = new FormData(event.currentTarget);

    const status = formData.get("status") as any;
    const incoterm = formData.get("incoterm") as string;
    const blNumber = formData.get("blNumber") as string;
    const etd = formData.get("etd") as string;
    const eta = formData.get("eta") as string;
    const customsChannel = formData.get("customsChannel") as any;

    startTransition(async () => {
      try {
        await updateOperationHeaderAction(operationId, {
          status,
          incoterm,
          blNumber,
          etd,
          eta,
          customsChannel,
        });
        setSuccessMsg("Datos operativos e Incoterm actualizados.");
      } catch (err: any) {
        alert(err.message || "Error al actualizar la operación.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Ship className="h-5 w-5 text-blue-600" /> Control de Despacho & Seguimiento
        </h2>
        {successMsg && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            ✓ {successMsg}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-6">
        {/* Incoterm */}
        <div className="space-y-1.5">
          <Label htmlFor="incoterm" className="text-xs font-semibold text-slate-700">Incoterm</Label>
          <select
            id="incoterm"
            name="incoterm"
            defaultValue={initialData.incoterm || "FOB"}
            className="flex h-9 w-full rounded-md border border-blue-200 bg-blue-50/50 px-3 py-1 text-xs font-bold text-blue-800 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {OFFICIAL_INCOTERMS.map((inc) => (
              <option key={inc.value} value={inc.value}>
                {inc.label}
              </option>
            ))}
          </select>
        </div>

        {/* Estado Operativo Detallado */}
        <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
          <Label htmlFor="status" className="text-xs font-semibold text-slate-700">Estado Logístico Contextual *</Label>
          <select
            id="status"
            name="status"
            defaultValue={initialData.status}
            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-slate-900"
          >
            <option value="COORDINANDO_ORIGEN">🛫 COORDINANDO EN ORIGEN</option>
            <option value="POR_RECOGER">📦 POR RECOGER (PROVEEDOR)</option>
            <option value="EN_ALMACEN_ORIGEN">🏢 EN ALMACÉN DE ORIGEN</option>
            <option value="EN_TRANSITO">🚢 EN TRÁNSITO INTERNACIONAL</option>
            <option value="EN_ADUANA_DESTINO">🛃 EN ADUANA DE DESTINO</option>
            <option value="EN_REPARTO">🚚 EN REPARTO / TRANSPORTE LOCAL</option>
            <option value="ENTREGADO">✅ ENTREGADO EN ALMACÉN CLIENTE</option>
            <option value="LIQUIDADO">🧾 LIQUIDADO</option>
          </select>
        </div>

        {/* BL Number */}
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

        {/* ETD */}
        <div className="space-y-1.5">
          <Label htmlFor="etd" className="text-xs font-semibold text-slate-700">ETD (Salida Origen)</Label>
          <ThreeColumnDatePicker
            id="etd"
            name="etd"
            value={etdValue}
            onChange={setEtdValue}
            placeholder="Seleccionar ETD"
          />
        </div>

        {/* ETA */}
        <div className="space-y-1.5">
          <Label htmlFor="eta" className="text-xs font-semibold text-slate-700">ETA (Llegada Destino)</Label>
          <ThreeColumnDatePicker
            id="eta"
            name="eta"
            value={etaValue}
            onChange={setEtaValue}
            placeholder="Seleccionar ETA"
          />
        </div>

        {/* Canal de Aduana */}
        <div className="space-y-1.5 sm:col-span-2 md:col-span-6">
          <Label htmlFor="customsChannel" className="text-xs font-semibold text-slate-700">Canal de Aduana (SUNAT)</Label>
          <select
            id="customsChannel"
            name="customsChannel"
            defaultValue={initialData.customsChannel || ""}
            className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
