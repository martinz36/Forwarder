"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calculator, Loader2, ArrowLeft, TrendingUp, DollarSign, Wallet, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { quotationSchema, QuotationFormValues } from "@/lib/validations/quotation";
import { createQuotationAction } from "@/app/quotations/actions";

interface ClientOption {
  id: string;
  businessName: string;
  documentNumber?: string;
}

interface ConceptOption {
  id: string;
  name: string;
  defaultCurrency: string;
  defaultPrice: number | null;
  isTaxable?: boolean;
}

interface QuotationFormProps {
  clients: ClientOption[];
  concepts: ConceptOption[];
}

function ConceptSearchInput({
  index,
  register,
  setValue,
  concepts,
  errors,
  handleSelectConcept,
  placeholder = "Escribe cualquier concepto libre...",
}: {
  index: number;
  register: any;
  setValue: any;
  concepts: ConceptOption[];
  errors: any;
  handleSelectConcept: (index: number, conceptName: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const filteredConcepts = concepts.filter((c) =>
    c.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-1.5">
        <Input
          placeholder={placeholder}
          className="h-8 text-xs font-medium w-full"
          {...register(`items.${index}.description` as const, {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              setFilterQuery(e.target.value);
            },
          })}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {concepts.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-8 px-2 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
            title="Ver catálogo de plantillas"
          >
            ⚡ Catálogo
          </button>
        )}
      </div>

      {/* Floating Dropdown Suggestion List */}
      {isOpen && filteredConcepts.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-100">
          <div className="p-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Plantillas del Catálogo (Clic para autocompletar)
          </div>
          {filteredConcepts.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                handleSelectConcept(index, c.name);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div>
                <span className="font-semibold text-slate-800">{c.name}</span>
                <span className="text-[10px] text-slate-400 ml-2">
                  {c.isTaxable ? "Afecto 18%" : "Inafecto"}
                </span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className="font-bold text-blue-600">
                  {c.defaultCurrency === "PEN" ? "S/" : "$"} {c.defaultPrice ?? 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {errors.items?.[index]?.description && (
        <p className="text-[11px] text-red-500 font-medium mt-1">
          {errors.items[index]?.description?.message}
        </p>
      )}
    </div>
  );
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
          isTaxable: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];

  // Live calculations for Summary (Cost, Sale, Profit, Taxable & IGV 18% for USD & PEN)
  let liveCostUsd = 0;
  let liveSaleUsd = 0;
  let liveTaxableUsd = 0;
  let liveNonTaxableUsd = 0;

  let liveCostPen = 0;
  let liveSalePen = 0;
  let liveTaxablePen = 0;
  let liveNonTaxablePen = 0;

  watchedItems.forEach((item) => {
    const cost = Number(item.unitCost) || 0;
    const price = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;
    const isTaxable = item.isTaxable !== false;

    const lineCost = cost * qty;
    const lineSale = price * qty;

    if (item.currency === "PEN") {
      liveCostPen += lineCost;
      liveSalePen += lineSale;
      if (isTaxable) {
        liveTaxablePen += lineSale;
      } else {
        liveNonTaxablePen += lineSale;
      }
    } else {
      liveCostUsd += lineCost;
      liveSaleUsd += lineSale;
      if (isTaxable) {
        liveTaxableUsd += lineSale;
      } else {
        liveNonTaxableUsd += lineSale;
      }
    }
  });

  const liveProfitUsd = liveSaleUsd - liveCostUsd;
  const liveProfitPen = liveSalePen - liveCostPen;

  const liveIgvUsd = Number((liveTaxableUsd * 0.18).toFixed(2));
  const liveTotalTaxableUsd = Number((liveTaxableUsd + liveIgvUsd).toFixed(2));
  const liveGrandTotalUsd = Number((liveTotalTaxableUsd + liveNonTaxableUsd).toFixed(2));

  const liveIgvPen = Number((liveTaxablePen * 0.18).toFixed(2));
  const liveTotalTaxablePen = Number((liveTaxablePen + liveIgvPen).toFixed(2));
  const liveGrandTotalPen = Number((liveTotalTaxablePen + liveIgvPen).toFixed(2));

  const marginUsdPct = liveSaleUsd > 0 ? ((liveProfitUsd / liveSaleUsd) * 100).toFixed(1) : "0.0";
  const marginPenPct = liveSalePen > 0 ? ((liveProfitPen / liveSalePen) * 100).toFixed(1) : "0.0";

  function handleSelectConcept(index: number, conceptName: string) {
    setValue(`items.${index}.description`, conceptName, { shouldValidate: true, shouldDirty: true });
    const matched = concepts.find((c) => c.name === conceptName);
    if (matched) {
      if (matched.defaultCurrency === "PEN" || matched.defaultCurrency === "USD") {
        setValue(`items.${index}.currency`, matched.defaultCurrency as "USD" | "PEN", { shouldValidate: true, shouldDirty: true });
      }
      if (matched.defaultPrice !== null && matched.defaultPrice !== undefined) {
        setValue(`items.${index}.unitPrice`, matched.defaultPrice, { shouldValidate: true, shouldDirty: true });
        // Default unitCost estimate at 65% of price if unspecified
        setValue(`items.${index}.unitCost`, Number((matched.defaultPrice * 0.65).toFixed(2)), { shouldValidate: true, shouldDirty: true });
      }
      if (matched.isTaxable !== undefined) {
        setValue(`items.${index}.isTaxable`, matched.isTaxable, { shouldValidate: true, shouldDirty: true });
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">
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
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold" disabled={isPending}>
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
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} {c.documentNumber ? `(${c.documentNumber})` : ""}
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

      {/* Dynamic Item Form (DataGrid / Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Conceptos y Costos Operativos</h2>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Escribe directamente cualquier concepto libre o haz clic en ⚡ Catálogo para autocompletar
          </span>
        </div>

        {errors.items && typeof errors.items.message === "string" && (
          <p className="text-xs font-medium text-red-500">{errors.items.message}</p>
        )}

        {/* Desktop View: Wide Dense DataGrid Table */}
        <div className="hidden md:block overflow-x-auto border rounded-xl bg-white shadow-sm w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-700 font-semibold">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-[40%] min-w-[280px]">Concepto / Servicio</th>
                <th className="py-2.5 px-3 w-28">Moneda</th>
                <th className="py-2.5 px-3 w-20 text-center">Cant.</th>
                <th className="py-2.5 px-3 w-32 text-right">Costo Unit.</th>
                <th className="py-2.5 px-3 w-32 text-right">Venta Unit.</th>
                <th className="py-2.5 px-3 w-32 text-right">Profit Línea</th>
                <th className="py-2.5 px-3 w-28 text-center">IGV (18%)</th>
                <th className="py-2.5 px-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
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
                  <tr key={field.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Line Index */}
                    <td className="py-2 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Free-text Concept Input + Smart Catalog Suggestions */}
                    <td className="py-2 px-3">
                      <ConceptSearchInput
                        index={index}
                        register={register}
                        setValue={setValue}
                        concepts={concepts}
                        errors={errors}
                        handleSelectConcept={handleSelectConcept}
                      />
                    </td>

                    {/* Currency */}
                    <td className="py-2 px-3">
                      <select
                        {...register(`items.${index}.currency` as const)}
                        className="flex h-8 w-full rounded-md border border-input bg-white px-2 text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="PEN">PEN (S/)</option>
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        min="1"
                        className="h-8 text-xs text-center font-medium px-1"
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                      />
                    </td>

                    {/* Unit Cost */}
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8 text-xs text-right font-medium bg-slate-50/50"
                        {...register(`items.${index}.unitCost` as const, { valueAsNumber: true })}
                      />
                    </td>

                    {/* Unit Price */}
                    <td className="py-2 px-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-8 text-xs text-right font-bold text-blue-900 border-blue-200"
                        {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                      />
                    </td>

                    {/* Line Profit (Read Only) */}
                    <td className="py-2 px-3 text-right font-black text-xs">
                      <span className={lineProfit >= 0 ? "text-emerald-600" : "text-red-600"}>
                        {formatCurrency(lineProfit, curr as "USD" | "PEN")}
                      </span>
                    </td>

                    {/* IGV Taxable Toggle */}
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        title={currentItem.isTaxable !== false ? "Afecto a IGV 18%" : "Inafecto a IGV"}
                        onClick={() => setValue(`items.${index}.isTaxable`, !(currentItem.isTaxable !== false))}
                        className={`h-7 px-2 rounded inline-flex items-center gap-1 text-[11px] font-bold border transition-colors ${
                          currentItem.isTaxable !== false
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {currentItem.isTaxable !== false ? (
                          <>
                            <CheckSquare className="h-3.5 w-3.5 text-blue-600" /> Afecto
                          </>
                        ) : (
                          <>
                            <Square className="h-3.5 w-3.5 text-amber-600" /> Inafecto
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions: Trash Icon Button */}
                    <td className="py-2 px-3 text-center">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar línea"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Stacked Cards */}
        <div className="block md:hidden space-y-4">
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
                      Línea #{index + 1}
                    </span>
                  </div>
                </div>

                {/* Mobile-First Stacked Grid */}
                <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
                  {/* Concept Description (sm:col-span-3) */}
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Concepto / Servicio *</Label>
                    <ConceptSearchInput
                      index={index}
                      register={register}
                      setValue={setValue}
                      concepts={concepts}
                      errors={errors}
                      handleSelectConcept={handleSelectConcept}
                    />
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
                    <Label className="text-xs font-semibold text-slate-700">Costo Unit.</Label>
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
                    <Label className="text-xs font-semibold text-blue-700">Precio Venta *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right font-bold text-blue-900 border-blue-200"
                      {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Quantity (sm:col-span-1) */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Cant.</Label>
                    <Input
                      type="number"
                      min="1"
                      className="text-center font-medium px-1"
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Taxable Toggle (sm:col-span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Afecto IGV</Label>
                    <button
                      type="button"
                      onClick={() => setValue(`items.${index}.isTaxable`, !(currentItem.isTaxable !== false))}
                      className={`flex h-9 w-full items-center justify-center gap-1.5 px-2 rounded-md text-xs font-bold border transition-colors ${
                        currentItem.isTaxable !== false
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {currentItem.isTaxable !== false ? <CheckSquare className="h-3.5 w-3.5 text-blue-600 shrink-0" /> : <Square className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                      <span className="truncate">{currentItem.isTaxable !== false ? "Afecto 18%" : "Inafecto"}</span>
                    </button>
                  </div>
                </div>

                {/* Line Calculation Summary Footer */}
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

        {/* Bottom Action Bar: Single "+ Agregar Ítem" Button */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", currency: "USD", unitCost: 0, unitPrice: 0, quantity: 1, isTaxable: true })}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-9 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Agregar Ítem
          </Button>

          <div className="text-xs text-slate-500 font-medium">
            Total líneas: <span className="font-bold text-slate-800">{fields.length}</span>
          </div>
        </div>
      </div>

      {/* Client Financial Summary Card (Desglose de Impuestos IGV 18% para el Cliente) */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl leading-tight text-slate-900">Resumen Propuesta Comercial (Vista Cliente)</h3>
              <p className="text-xs text-slate-500">Desglose oficial con impuestos (IGV 18%) y montos inafectos a facturar al cliente</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* USD Client Summary */}
          <div className="rounded-xl bg-blue-50/50 p-5 border border-blue-100 space-y-3">
            <span className="font-bold text-sm text-blue-900 flex items-center gap-1.5 border-b border-blue-200 pb-2">
              <DollarSign className="h-4 w-4 text-blue-600" /> Cobro en Dólares (USD $)
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Servicios (Afectos IGV):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(liveTaxableUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center text-blue-700 font-bold">
                <span>IGV (18% Ley Peruana):</span>
                <span className="text-right">{formatCurrency(liveIgvUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Reembolsos (Inafectos):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(liveNonTaxableUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="font-black text-slate-900 text-sm sm:text-base">TOTAL A PAGAR USD:</span>
                <span className="font-black text-blue-700 text-lg sm:text-xl text-right">{formatCurrency(liveGrandTotalUsd, "USD")}</span>
              </div>
            </div>
          </div>

          {/* PEN Client Summary */}
          <div className="rounded-xl bg-purple-50/50 p-5 border border-purple-100 space-y-3">
            <span className="font-bold text-sm text-purple-900 flex items-center gap-1.5 border-b border-purple-200 pb-2">
              <Wallet className="h-4 w-4 text-purple-600" /> Cobro en Soles (PEN S/)
            </span>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Servicios (Afectos IGV):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(liveTaxablePen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center text-purple-700 font-bold">
                <span>IGV (18% Ley Peruana):</span>
                <span className="text-right">{formatCurrency(liveIgvPen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Reembolsos (Inafectos):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(liveNonTaxablePen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                <span className="font-black text-slate-900 text-sm sm:text-base">TOTAL A PAGAR PEN:</span>
                <span className="font-black text-purple-700 text-lg sm:text-xl text-right">{formatCurrency(liveGrandTotalPen, "PEN")}</span>
              </div>
            </div>
          </div>
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
