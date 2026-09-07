"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Calculator, Loader2, ArrowLeft, DollarSign } from "lucide-react";
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

  // Calculate live totals
  let liveTotalUsd = 0;
  let liveTotalPen = 0;

  watchedItems.forEach((item) => {
    const price = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 0;
    const lineTotal = price * qty;
    if (item.currency === "PEN") {
      liveTotalPen += lineTotal;
    } else {
      liveTotalUsd += lineTotal;
    }
  });

  function handleSelectConcept(index: number, conceptName: string) {
    setValue(`items.${index}.description`, conceptName);
    const matched = concepts.find((c) => c.name === conceptName);
    if (matched) {
      if (matched.defaultCurrency === "PEN" || matched.defaultCurrency === "USD") {
        setValue(`items.${index}.currency`, matched.defaultCurrency as "USD" | "PEN");
      }
      if (matched.defaultPrice !== null && matched.defaultPrice !== undefined) {
        setValue(`items.${index}.unitPrice`, matched.defaultPrice);
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
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/quotations">
              <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Cotización Bimonetaria</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa los detalles del cliente y los conceptos en dólares ($) y soles (S/).
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

      {/* Basic Info Section */}
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

      {/* Dynamic Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Conceptos y Servicios</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", currency: "USD", unitPrice: 0, quantity: 1 })}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Agregar Línea
          </Button>
        </div>

        {errors.items && typeof errors.items.message === "string" && (
          <p className="text-xs font-medium text-red-500">{errors.items.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const currentItem = watchedItems[index] || {};
            const itemPrice = Number(currentItem.unitPrice) || 0;
            const itemQty = Number(currentItem.quantity) || 0;
            const lineTotal = itemPrice * itemQty;
            const curr = currentItem.currency || "USD";

            return (
              <div
                key={field.id}
                className="rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-slate-300"
              >
                {/* Mobile & Desktop Responsive Stack */}
                <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
                  {/* Concept / Description (sm:span-5) */}
                  <div className="sm:col-span-5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-slate-700">
                        Concepto / Servicio #{index + 1} *
                      </Label>
                      {concepts.length > 0 && (
                        <select
                          className="text-xs text-blue-600 bg-slate-50 border rounded px-1.5 py-0.5 cursor-pointer"
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSelectConcept(index, e.target.value);
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            ⚡ Cargar del catálogo...
                          </option>
                          {concepts.map((conc) => (
                            <option key={conc.id} value={conc.name}>
                              {conc.name} ({conc.defaultCurrency})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
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

                  {/* Currency (sm:span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Moneda</Label>
                    <select
                      {...register(`items.${index}.currency` as const)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="PEN">PEN (S/)</option>
                    </select>
                  </div>

                  {/* Unit Price (sm:span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Precio Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right font-medium"
                      {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Quantity (sm:span-1) */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Cant.</Label>
                    <Input
                      type="number"
                      min="1"
                      className="text-center font-medium"
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Subtotal & Delete (sm:span-2) */}
                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0">
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block sm:hidden">
                        Total Línea
                      </span>
                      <span className="font-bold text-slate-900 text-sm block">
                        {formatCurrency(lineTotal, curr as "USD" | "PEN")}
                      </span>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 h-9 w-9 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Totals Card (Bimonetario) */}
      <div className="rounded-xl border bg-slate-900 text-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600/30 p-2.5 text-blue-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Resumen Bimonetario</h3>
              <p className="text-xs text-slate-400">Suma automática dividida por moneda</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 bg-slate-800/80 p-4 rounded-lg border border-slate-700/50">
            {/* Total USD */}
            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Total USD ($)
              </span>
              <span className="text-2xl font-black text-white">
                {formatCurrency(liveTotalUsd, "USD")}
              </span>
            </div>

            <div className="hidden sm:block w-px bg-slate-700 self-stretch" />

            {/* Total PEN */}
            <div className="text-left sm:text-right">
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Total PEN (S/)
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrency(liveTotalPen, "PEN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
