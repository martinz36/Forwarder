"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Loader2, CheckSquare, ListChecks } from "lucide-react";
import { toggleOperationMilestoneAction, OperationMilestoneKey } from "@/app/operations/actions";

interface OperationMilestonesProps {
  operationId: string;
  milestones: {
    hblApproved: boolean;
    customsDocsSent: boolean;
    taxesPaid: boolean;
    transportDocsSent: boolean;
    cargoDelivered: boolean;
  };
}

const MILESTONE_ITEMS: Array<{
  key: OperationMilestoneKey;
  label: string;
  description: string;
}> = [
  {
    key: "hblApproved",
    label: "HBL Aprobado",
    description: "Visto Bueno del House Bill of Lading por el cliente importador.",
  },
  {
    key: "customsDocsSent",
    label: "Documentos de Aduana Enviados",
    description: "Expediente digital enviado a la agencia de aduana para numeración.",
  },
  {
    key: "taxesPaid",
    label: "Tributos / Impuestos Cancelados",
    description: "Pago de Ad Valorem e IGV registrado en la SUNAT.",
  },
  {
    key: "transportDocsSent",
    label: "Documentos de Transporte Liberados",
    description: "Volante de despacho y autorización de retiro de depósito temporal.",
  },
  {
    key: "cargoDelivered",
    label: "Carga Entregada en Destino",
    description: "Entrega física de la mercancía realizada en almacén del cliente.",
  },
];

export function OperationMilestones({
  operationId,
  milestones,
}: OperationMilestonesProps) {
  const [isPending, startTransition] = useTransition();
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const completedCount = Object.values(milestones).filter(Boolean).length;
  const totalCount = MILESTONE_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleToggle = (key: OperationMilestoneKey, currentValue: boolean) => {
    setUpdatingKey(key);
    startTransition(async () => {
      try {
        await toggleOperationMilestoneAction(operationId, key, currentValue);
      } catch (err: any) {
        alert(err?.message || "Error al actualizar el hito logístico.");
      } finally {
        setUpdatingKey(null);
      }
    });
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
      {/* Header & Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-blue-600" />
            <span>Hitos Logísticos y Coordinaciones</span>
          </h3>
          <p className="text-xs text-slate-500">
            Checklist operativo de seguimiento y control de despacho.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-700">
            {completedCount} de {totalCount} Completados ({progressPercent}%)
          </span>
          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border">
            <div
              className="bg-blue-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checkbox Items Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MILESTONE_ITEMS.map((item) => {
          const isDone = milestones[item.key];
          const isCurrentUpdating = updatingKey === item.key;

          return (
            <div
              key={item.key}
              onClick={() => !isPending && handleToggle(item.key, isDone)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                isDone
                  ? "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50"
                  : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/80"
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isCurrentUpdating ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                )}
              </div>

              <div className="space-y-0.5">
                <span
                  className={`text-xs font-bold block ${
                    isDone ? "text-emerald-900 line-through decoration-emerald-500/50" : "text-slate-900"
                  }`}
                >
                  {item.label}
                </span>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
