"use client";

import { useTransition } from "react";
import { Receipt, Loader2, ArrowRight, FileCheck, ShieldAlert, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { toggleChargeTaxableAction, generateLiquidationAction } from "@/app/liquidations/actions";

interface ChargeItem {
  id: string;
  description: string;
  currency: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  totalCost: number;
  totalPrice: number;
  isExtraCharge: boolean;
  isTaxable: boolean;
}

interface OperationChargesManagerProps {
  operationId: string;
  charges: ChargeItem[];
  existingLiquidationId?: string | null;
}

export function OperationChargesManager({
  operationId,
  charges,
  existingLiquidationId,
}: OperationChargesManagerProps) {
  const [isPending, startTransition] = useTransition();

  const baseCharges = charges.filter((c) => !c.isExtraCharge);
  const extraCharges = charges.filter((c) => c.isExtraCharge);

  function handleToggleTaxable(chargeId: string, currentIsTaxable: boolean) {
    startTransition(async () => {
      await toggleChargeTaxableAction(chargeId, !currentIsTaxable, operationId);
    });
  }

  function handleGenerateLiquidation() {
    startTransition(async () => {
      await generateLiquidationAction(operationId);
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Action to Generate Liquidation */}
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-600 p-2.5 text-white shadow">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Liquidación Final & División de IGV (18%)</h3>
            <p className="text-xs text-slate-300">
              Clasifica los cargos afectos al IGV (Servicios Broker) vs inafectos (Reembolso Terceros) antes de liquidar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {existingLiquidationId && (
            <Link href={`/liquidations/${existingLiquidationId}`}>
              <Button variant="outline" className="border-indigo-400 text-indigo-100 hover:bg-indigo-800 text-xs font-bold">
                Ver Liquidación Existente
              </Button>
            </Link>
          )}

          <Button
            type="button"
            onClick={handleGenerateLiquidation}
            disabled={isPending || charges.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Procesando IGV...
              </>
            ) : (
              <>
                <FileCheck className="mr-1.5 h-4 w-4" /> Generar Liquidación Final <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Base Charges Table with Taxable Toggle */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base">Cargos Base Cotizados</h3>

        {/* Mobile View */}
        <div className="grid gap-3 md:hidden">
          {baseCharges.map((charge) => (
            <div key={charge.id} className="rounded-xl border bg-white p-3.5 shadow-sm space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-slate-900 text-sm">{charge.description}</span>
                <Badge variant="outline" className="text-xs">
                  {charge.currency}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t pt-2 text-xs">
                <span className="font-bold text-slate-900">{formatCurrency(charge.totalPrice, charge.currency as any)}</span>
                <button
                  type="button"
                  onClick={() => handleToggleTaxable(charge.id, charge.isTaxable)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${
                    charge.isTaxable
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                >
                  {charge.isTaxable ? <CheckSquare className="h-3.5 w-3.5 text-blue-600" /> : <Square className="h-3.5 w-3.5 text-slate-400" />}
                  {charge.isTaxable ? "Afecto IGV (18%)" : "Inafecto / Reembolso"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-700 font-semibold">
              <tr>
                <th className="p-3 text-left">Concepto Base</th>
                <th className="p-3 text-center">Moneda</th>
                <th className="p-3 text-center">Cant.</th>
                <th className="p-3 text-right">Costo Total</th>
                <th className="p-3 text-right">Venta Total</th>
                <th className="p-3 text-center">Afectación Fiscal (IGV)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {baseCharges.map((charge) => (
                <tr key={charge.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-medium text-slate-900 text-left">{charge.description}</td>
                  <td className="p-3 text-center font-bold text-xs">{charge.currency}</td>
                  <td className="p-3 text-center">{charge.quantity}</td>
                  <td className="p-3 text-right text-slate-600 font-medium">
                    {formatCurrency(charge.totalCost, charge.currency as any)}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatCurrency(charge.totalPrice, charge.currency as any)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleTaxable(charge.id, charge.isTaxable)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                        charge.isTaxable
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {charge.isTaxable ? <CheckSquare className="h-3.5 w-3.5 text-blue-600" /> : <Square className="h-3.5 w-3.5 text-amber-600" />}
                      {charge.isTaxable ? "Afecto IGV (18%)" : "Inafecto (Terceros)"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extra Charges Table with Taxable Toggle */}
      {extraCharges.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-amber-900 text-base">Cargos Adicionales / Sobrecostos</h3>

          {/* Desktop View */}
          <div className="hidden md:block rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-amber-50/70 border-b border-amber-200 text-amber-900 font-semibold">
                <tr>
                  <th className="p-3 text-left">Sobrecosto</th>
                  <th className="p-3 text-center">Moneda</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">Costo Total</th>
                  <th className="p-3 text-right">Venta Total</th>
                  <th className="p-3 text-center">Afectación Fiscal (IGV)</th>
                </tr>
              </thead>
              <tbody className="divide-y border-amber-100">
                {extraCharges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-amber-50/30">
                    <td className="p-3 font-semibold text-slate-900 text-left">{charge.description}</td>
                    <td className="p-3 text-center font-bold text-xs">{charge.currency}</td>
                    <td className="p-3 text-center">{charge.quantity}</td>
                    <td className="p-3 text-right text-slate-600 font-medium">
                      {formatCurrency(charge.totalCost, charge.currency as any)}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-950">
                      {formatCurrency(charge.totalPrice, charge.currency as any)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleTaxable(charge.id, charge.isTaxable)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                          charge.isTaxable
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {charge.isTaxable ? <CheckSquare className="h-3.5 w-3.5 text-blue-600" /> : <Square className="h-3.5 w-3.5 text-amber-600" />}
                        {charge.isTaxable ? "Afecto IGV (18%)" : "Inafecto (Terceros)"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
