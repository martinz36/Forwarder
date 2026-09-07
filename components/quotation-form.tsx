"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calculator, Loader2, ArrowLeft, TrendingUp, DollarSign, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { quotationSchema, QuotationFormValues } from "@/lib/validations/quotation";
import { createQuotationAction } from "@/app/quotations/actions";

interface ClientOption {
  id: string;
  name: string;
}

interface ConceptOption {
  id: string;
  name: string;
  defaultCurrency: string;
  defaultPrice: number | null;
}

interface QuotationFormProps {
  clients: ClientOption[];
  concepts: ConceptOption[];
}

export function QuotationForm({ clients, concepts }: QuotationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      clientId: clients[0]?.id || "",
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [
        {
          description: "Despacho Aduanero (Comisión Agente)",
          currency: "USD",
          unitCost: 120,
          unitPrice: 200,
          quantity: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];

  // Live calculations for Summary (Cost, Sale, Profit for USD & PEN)
  let liveCostUsd = 0;
  let liveSaleUsd = 0;
  let liveCostPen = 0;
  let liveSalePen = 0;

  watchedItems.forEach((item) => {
    const cost = Number(item.unitCost) || 0;
    const price = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;

    const lineCost = cost * qty;
    const lineSale = price * qty;

    if (item.currency === "PEN") {
      liveCostPen += lineCost;
      liveSalePen += lineSale;
    } else {
      liveCostUsd += lineCost;
      liveSaleUsd += lineSale;
    }
  });

  const liveProfitUsd = liveSaleUsd - liveCostUsd;
  const liveProfitPen = liveSalePen - liveCostPen;

  const marginUsdPct = liveSaleUsd > 0 ? ((liveProfitUsd / liveSaleUsd) * 100).toFixed(1) : "0.0";
  const marginPenPct = liveSalePen > 0 ? ((liveProfitPen / liveSalePen) * 100).toFixed(1) : "0.0";

  function handleSelectConcept(index: number, conceptName: string) {
    setValue(`items.${index}.description`, conceptName);
    const matched = concepts.find((c) => c.name === conceptName);
    if (matched) {
      if (matched.defaultCurrency === "PEN" || matched.defaultCurrency === "USD") {
        setValue(`items.${index}.currency`, matched.defaultCurrency as "USD" | "PEN");
      }
      if (matched.defaultPrice !== null && matched.defaultPrice !== undefined) {
        setValue(`items.${index}.unitPrice`, matched.defaultPrice);
        // Default unitCost estimate at 65% of price if unspecified
        setValue(`items.${index}.unitCost`, Number((matched.defaultPrice * 0.65).toFixed(2)));
      }
    }
  }

  function onSubmit(values: QuotationFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await createQuotationAction(values);
      } catch (err: any) {
        setServerError(err.message || "Ocurrió un error al guardar la cotización.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Top Action Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/quotations">
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Cotización Broker</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Simulador de cotización en tiempo real con cálculo automático de Costos, Venta y Profit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/quotations">
            <Button type="button" variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Guardar Cotización"
            )}
          </Button>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {serverError}
        </div>
      )}

      {/* Client & Date Info */}
      <div className="grid gap-6 md:grid-cols-2 rounded-xl border bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="clientId" className="font-semibold text-slate-800">
            Cliente / Razón Social *
          </Label>
          {clients.length === 0 ? (
            <div className="text-sm text-amber-600 bg-amber-50 p-2.5 rounded-md border border-amber-200">
              No hay clientes registrados. <Link href="/clients" className="underline font-bold">Crear cliente primero</Link>.
            </div>
          ) : (
            <select
              id="clientId"
              {...register("clientId")}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {errors.clientId && (
            <p className="text-xs font-medium text-red-500">{errors.clientId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="validUntil" className="font-semibold text-slate-800">
            Fecha de Validez
          </Label>
          <Input id="validUntil" type="date" {...register("validUntil")} />
          {errors.validUntil && (
            <p className="text-xs font-medium text-red-500">{errors.validUntil.message}</p>
          )}
        </div>
      </div>

      {/* Dynamic Item Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Conceptos y Costos Operativos</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", currency: "USD", unitCost: 0, unitPrice: 0, quantity: 1 })}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Agregar Ítem
          </Button>
        </div>

        {errors.items && typeof errors.items.message === "string" && (
          <p className="text-xs font-medium text-red-500">{errors.items.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => {
            const currentItem = watchedItems[index] || {};
            const itemCost = Number(currentItem.unitCost) || 0;
            const itemPrice = Number(currentItem.unitPrice) || 0;
            const itemQty = Number(currentItem.quantity) || 0;

            const lineCost = itemCost * itemQty;
            const lineSale = itemPrice * itemQty;
            const lineProfit = lineSale - lineCost;
            const curr = currentItem.currency || "USD";

            return (
              <div
                key={field.id}
                className="rounded-xl border bg-white p-4 shadow-sm space-y-4 transition-all hover:border-slate-300"
              >
                {/* Header line for Mobile */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      Línea de Servicio #{index + 1}
                    </span>
                  </div>

                  {concepts.length > 0 && (
                    <select
                      className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1 cursor-pointer font-medium"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSelectConcept(index, e.target.value);
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        ⚡ Cargar del Catálogo...
                      </option>
                      {concepts.map((conc) => (
                        <option key={conc.id} value={conc.name}>
                          {conc.name} ({conc.defaultCurrency})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Mobile-First Stacked Grid */}
                <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
                  {/* Concept Description (sm:col-span-4) */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Concepto / Servicio *</Label>
                    <Input
                      placeholder="Ej: Flete Internacional, Handling, Visto Bueno..."
                      {...register(`items.${index}.description` as const)}
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-red-500">
                        {errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  {/* Currency (sm:col-span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Moneda</Label>
                    <select
                      {...register(`items.${index}.currency` as const)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="PEN">PEN (S/)</option>
                    </select>
                  </div>

                  {/* Unit Cost (sm:col-span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Costo Unit. (Proveedor)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right font-medium bg-slate-50/50"
                      {...register(`items.${index}.unitCost` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Unit Price (sm:col-span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-blue-700">Precio Venta Unit. *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right font-bold text-blue-900 border-blue-200"
                      {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Quantity (sm:col-span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      className="text-center font-medium"
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                    />
                  </div>
                </div>

                {/* Line Calculation Summary Footer (Cost, Sale, Profit) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t bg-slate-50/70 -mx-4 -mb-4 p-3 rounded-b-xl">
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Costo Línea: </span>
                      <span className="font-semibold text-slate-700">{formatCurrency(lineCost, curr as "USD" | "PEN")}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Venta Línea: </span>
                      <span className="font-bold text-slate-900">{formatCurrency(lineSale, curr as "USD" | "PEN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Item Profit Badge */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Profit Línea:</span>
                      <span className={`font-black text-sm ${lineProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(lineProfit, curr as "USD" | "PEN")}
                      </span>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Profit Summary Card (Broker Financial Panel) */}
      <div className="rounded-2xl border bg-slate-950 text-white p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl leading-tight">Panel de Rentabilidad (Broker Profit)</h3>
              <p className="text-xs text-slate-400">Cálculo de margen proyectado en tiempo real</p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Grid (USD and PEN) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* USD Breakdown Card */}
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-blue-400" /> Moneda Dólares (USD)
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Margen {marginUsdPct}%
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Costo Proveedores:</span>
                <span className="font-semibold text-slate-300 text-right">{formatCurrency(liveCostUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Total Venta Cliente:</span>
                <span className="font-bold text-white text-right">{formatCurrency(liveSaleUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-emerald-400 text-base">Ganancia Neta (Profit USD):</span>
                <span className="font-black text-emerald-400 text-xl text-right">{formatCurrency(liveProfitUsd, "USD")}</span>
              </div>
            </div>
          </div>

          {/* PEN Breakdown Card */}
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-purple-400" /> Moneda Soles (PEN)
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Margen {marginPenPct}%
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Costo Proveedores:</span>
                <span className="font-semibold text-slate-300 text-right">{formatCurrency(liveCostPen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 font-medium">
                <span>Total Venta Cliente:</span>
                <span className="font-bold text-white text-right">{formatCurrency(liveSalePen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-emerald-400 text-base">Ganancia Neta (Profit PEN):</span>
                <span className="font-black text-emerald-400 text-xl text-right">{formatCurrency(liveProfitPen, "PEN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
