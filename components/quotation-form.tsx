"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Calculator,
  Loader2,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Wallet,
  CheckSquare,
  Square,
  Ship,
  FileText,
  Anchor,
  Globe,
  Package,
  FileUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { quotationSchema, QuotationFormValues } from "@/lib/validations/quotation";
import { createQuotationAction, parseQuotationPdfAction } from "@/app/quotations/actions";

export const CATEGORY_OPTIONS = [
  { value: "GASTOS_ORIGEN", label: "Gastos de Origen", defaultTaxable: false },
  { value: "FLETE_INTERNACIONAL", label: "Flete Internacional", defaultTaxable: false },
  { value: "SEGURO", label: "Seguro (Opcional)", defaultTaxable: false },
  { value: "GASTOS_LOCALES", label: "Gastos Locales", defaultTaxable: true },
];

interface ClientOption {
  id: string;
  businessName: string;
  documentNumber?: string;
}

interface ConceptOption {
  id: string;
  name: string;
  category?: string;
  defaultCurrency: string;
  defaultPrice: number | null;
  isTaxable?: boolean;
}

interface QuotationFormProps {
  clients: ClientOption[];
  concepts: ConceptOption[];
}

export function QuotationForm({ clients, concepts }: QuotationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

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
      modality: "IMPORTACIÓN MARÍTIMA",
      incoterm: "EXW",
      origin: "SHANGHAI - CHINA",
      destination: "CALLAO - PERU",
      shippingType: "Directo",
      shippingLine: "COSCO / MAERSK",
      frequency: "SEMANAL",
      transitTime: "35 DÍAS APROX.",
      cargoType: "CARGA GENERAL",
      packagesCount: "10 BULTOS",
      grossWeight: "305.00 KG",
      volume: "2.200 CBM",
      loadType: "LCL / LCL",
      containersCount: "0 X LCL",
      notes: "- TARIFA HASTA 5 CBM, EN CASO DE SUPERAR SE VOLVERÁ A COTIZAR.\n- VERIFICAR LA TARIFA VIGENTE SEGÚN FECHA DE ZARPE.",
      items: [
        {
          description: "EXW CHARGES (Gastos de Origen)",
          category: "GASTOS_ORIGEN",
          currency: "USD",
          unitCost: 120,
          unitPrice: 200,
          quantity: 1,
          isTaxable: false,
        },
        {
          description: "OCEAN FREIGHT TON/M3 (Flete Marítimo)",
          category: "FLETE_INTERNACIONAL",
          currency: "USD",
          unitCost: 180,
          unitPrice: 264,
          quantity: 1,
          isTaxable: false,
        },
        {
          description: "Despacho Aduanero (Comisión Agente)",
          category: "GASTOS_LOCALES",
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

  // Live calculations for Summary
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
  const liveGrandTotalPen = Number((liveTotalTaxablePen + liveNonTaxablePen).toFixed(2));

  const marginUsdPct = liveSaleUsd > 0 ? ((liveProfitUsd / liveSaleUsd) * 100).toFixed(1) : "0.0";
  const marginPenPct = liveSalePen > 0 ? ((liveProfitPen / liveSalePen) * 100).toFixed(1) : "0.0";

  function handleCategoryChange(index: number, newCat: string) {
    setValue(`items.${index}.category`, newCat as any);
    const catConfig = CATEGORY_OPTIONS.find((c) => c.value === newCat);
    if (catConfig) {
      setValue(`items.${index}.isTaxable`, catConfig.defaultTaxable);
    }
  }

  function handleSelectConcept(index: number, conceptName: string) {
    setValue(`items.${index}.description`, conceptName);
    const matched = concepts.find((c) => c.name === conceptName);
    if (matched) {
      if (matched.category) {
        setValue(`items.${index}.category`, matched.category as any);
      }
      if (matched.defaultCurrency === "PEN" || matched.defaultCurrency === "USD") {
        setValue(`items.${index}.currency`, matched.defaultCurrency as "USD" | "PEN");
      }
      if (matched.defaultPrice !== null && matched.defaultPrice !== undefined) {
        setValue(`items.${index}.unitPrice`, matched.defaultPrice);
        setValue(`items.${index}.unitCost`, Number((matched.defaultPrice * 0.65).toFixed(2)));
      }
      if (matched.isTaxable !== undefined) {
        setValue(`items.${index}.isTaxable`, matched.isTaxable);
      } else if (matched.category) {
        const catConfig = CATEGORY_OPTIONS.find((c) => c.value === matched.category);
        if (catConfig) {
          setValue(`items.${index}.isTaxable`, catConfig.defaultTaxable);
        }
      }
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfSuccessMessage(null);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await parseQuotationPdfAction(formData);

      // Auto fill metadata fields if present
      if (res.metadata.origin) setValue("origin", res.metadata.origin);
      if (res.metadata.destination) setValue("destination", res.metadata.destination);
      if (res.metadata.incoterm) setValue("incoterm", res.metadata.incoterm);
      if (res.metadata.shippingType) setValue("shippingType", res.metadata.shippingType);
      if (res.metadata.shippingLine) setValue("shippingLine", res.metadata.shippingLine);
      if (res.metadata.frequency) setValue("frequency", res.metadata.frequency);
      if (res.metadata.transitTime) setValue("transitTime", res.metadata.transitTime);
      if (res.metadata.cargoType) setValue("cargoType", res.metadata.cargoType);
      if (res.metadata.packagesCount) setValue("packagesCount", res.metadata.packagesCount);
      if (res.metadata.grossWeight) setValue("grossWeight", res.metadata.grossWeight);
      if (res.metadata.volume) setValue("volume", res.metadata.volume);
      if (res.metadata.loadType) setValue("loadType", res.metadata.loadType);
      if (res.metadata.containersCount) setValue("containersCount", res.metadata.containersCount);
      if (res.metadata.notes) setValue("notes", res.metadata.notes);

      // Auto replace items if items found
      if (res.items && res.items.length > 0) {
        setValue("items", res.items as any);
        setPdfSuccessMessage(`¡Éxito! Se extrajeron ${res.items.length} conceptos y datos de embarque desde el PDF. Revisa tus Costos y ajusta tus Precios de Venta.`);
      } else {
        setPdfSuccessMessage("Se analizaron los datos del embarque desde el PDF. Puedes agregar manualmente tus líneas de servicio.");
      }
    } catch (err: any) {
      setServerError(err.message || "Error al procesar el archivo PDF.");
    } finally {
      setIsParsingPdf(false);
      e.target.value = "";
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva Cotización Comercial</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Formato oficial de cotización de carga internacional con desglose de impuestos y rentabilidad.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/quotations">
            <Button type="button" variant="outline" disabled={isPending}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow" disabled={isPending}>
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

      {/* PDF Import Banner Card */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Importador Inteligente de Cotizaciones PDF</h3>
            <p className="text-xs text-slate-600">
              Sube el PDF recibido de tu Forwarder / Naviera para extraer automáticamente todos los datos y costos operativos.
            </p>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfUpload}
            disabled={isParsingPdf}
          />
          <Button
            type="button"
            disabled={isParsingPdf}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 px-4 shadow-sm pointer-events-none"
          >
            {isParsingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando PDF...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" /> Importar desde PDF de Forwarder
              </>
            )}
          </Button>
        </label>
      </div>

      {pdfSuccessMessage && (
        <div className="rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {pdfSuccessMessage}
        </div>
      )}

      {serverError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {serverError}
        </div>
      )}

      {/* Client & Basic Information */}
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
          <Input id="validUntil" type="date" {...register("validUntil")} className="h-10" />
          {errors.validUntil && (
            <p className="text-xs font-medium text-red-500">{errors.validUntil.message}</p>
          )}
        </div>
      </div>

      {/* Section: Datos del Embarque (Shipment Header Metadata) */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 text-slate-900">
          <Ship className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-bold">Datos del Embarque y Operación Logística</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Modalidad *</Label>
            <select
              {...register("modality")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
            >
              <option value="IMPORTACIÓN MARÍTIMA">IMPORTACIÓN MARÍTIMA</option>
              <option value="EXPORTACIÓN MARÍTIMA">EXPORTACIÓN MARÍTIMA</option>
              <option value="IMPORTACIÓN AÉREA">IMPORTACIÓN AÉREA</option>
              <option value="EXPORTACIÓN AÉREA">EXPORTACIÓN AÉREA</option>
              <option value="TRANSPORTE TERRESTRE">TRANSPORTE TERRESTRE</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Incoterm</Label>
            <Input placeholder="Ej: EXW, FOB, CIF, CFR" {...register("incoterm")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Puerto / Origen</Label>
            <Input placeholder="Ej: SHANGHAI - CHINA" {...register("origin")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Puerto / Destino</Label>
            <Input placeholder="Ej: CALLAO - PERU" {...register("destination")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Tipo de Envío</Label>
            <Input placeholder="Ej: Directo / Transbordo" {...register("shippingType")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Línea Marítima / Aérea</Label>
            <Input placeholder="Ej: COSCO, MAERSK" {...register("shippingLine")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Frecuencia</Label>
            <Input placeholder="Ej: SEMANAL" {...register("frequency")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Tiempo de Tránsito</Label>
            <Input placeholder="Ej: 35 DÍAS APROX." {...register("transitTime")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Tipo de Carga</Label>
            <Input placeholder="Ej: CARGA GENERAL" {...register("cargoType")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Bultos / Cantidad</Label>
            <Input placeholder="Ej: 10 CARTONES / 0" {...register("packagesCount")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Peso Bruto (KG)</Label>
            <Input placeholder="Ej: 305.00 KG" {...register("grossWeight")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Volumen (CBM)</Label>
            <Input placeholder="Ej: 2.200 CBM" {...register("volume")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Tipo Flete / Contenedor</Label>
            <Input placeholder="Ej: LCL / LCL, FCL / FCL" {...register("loadType")} className="h-9 text-xs" />
          </div>

          <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
            <Label className="text-xs font-semibold text-slate-700">Cantidad / Detalle de Contenedores</Label>
            <Input placeholder="Ej: 1 X 40'HQ o 0 X LCL" {...register("containersCount")} className="h-9 text-xs" />
          </div>
        </div>
      </div>

      {/* Dynamic Items Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Conceptos y Costos Operativos</h2>
            <p className="text-xs text-slate-500">Clasifica los conceptos por categoría (Gastos de Origen, Flete, Gastos Locales).</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                description: "",
                category: "GASTOS_LOCALES",
                currency: "USD",
                unitCost: 0,
                unitPrice: 0,
                quantity: 1,
                isTaxable: true,
              })
            }
            className="text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold"
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
                {/* Line Header */}
                <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
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
                      className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2.5 py-1 cursor-pointer font-medium"
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

                {/* Mobile-First Grid */}
                <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
                  {/* Category (sm:col-span-3) */}
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Categoría *</Label>
                    <select
                      value={currentItem.category || "GASTOS_LOCALES"}
                      onChange={(e) => handleCategoryChange(index, e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-bold text-slate-800"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Concept Description (sm:col-span-3) */}
                  <div className="sm:col-span-3 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Concepto / Servicio *</Label>
                    <Input
                      placeholder="Ej: Flete Internacional, Handling, Visto Bueno..."
                      {...register(`items.${index}.description` as const)}
                      className="h-9 text-xs"
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
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="PEN">PEN (S/)</option>
                    </select>
                  </div>

                  {/* Unit Cost (sm:col-span-1) */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Costo U.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right font-medium bg-slate-50/50 h-9 text-xs px-1"
                      {...register(`items.${index}.unitCost` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Unit Price (sm:col-span-1) */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs font-semibold text-blue-700">Precio V.*</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right font-bold text-blue-900 border-blue-200 h-9 text-xs px-1"
                      {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Quantity (sm:col-span-1) */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Cant.</Label>
                    <Input
                      type="number"
                      min="1"
                      className="text-center font-medium px-1 h-9 text-xs"
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                    />
                  </div>

                  {/* Taxable Toggle (sm:col-span-1) */}
                  <div className="sm:col-span-1 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">IGV</Label>
                    <button
                      type="button"
                      onClick={() => setValue(`items.${index}.isTaxable`, !(currentItem.isTaxable !== false))}
                      className={`flex h-9 w-full items-center justify-center gap-1 px-1 rounded-md text-[11px] font-bold border transition-colors ${
                        currentItem.isTaxable !== false
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {currentItem.isTaxable !== false ? (
                        <CheckSquare className="h-3 w-3 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="h-3 w-3 text-amber-600 shrink-0" />
                      )}
                      <span className="truncate">{currentItem.isTaxable !== false ? "18%" : "Inafecto"}</span>
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
      </div>

      {/* Observations / Terms & Conditions */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-2">
        <Label htmlFor="notes" className="font-semibold text-slate-800 text-sm">
          Observaciones / Términos y Condiciones
        </Label>
        <textarea
          id="notes"
          rows={3}
          {...register("notes")}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
          placeholder="Términos comerciales, validez de fletes, condiciones de pago..."
        />
      </div>

      {/* Client Financial Summary Card (Vista Cliente) */}
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
                <span>Subtotal Reembolsos / Origen (Inafectos):</span>
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
                <span>Subtotal Reembolsos / Origen (Inafectos):</span>
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

      {/* Real-time Profit Summary Card (Broker Internal Panel) */}
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
              <span className="font-bold text-sm text-purple-400 flex items-center gap-1.5">
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
