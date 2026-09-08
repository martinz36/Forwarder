import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  MapPin,
  Receipt,
  TrendingUp,
  User,
  Ship,
  Globe,
  Anchor,
  Box,
  Clock,
  CheckCircle2,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConvertQuotationButton } from "@/components/convert-quotation-button";
import { DownloadPdfButton } from "@/components/pdf/download-pdf-button";

export const dynamic = "force-dynamic";

interface QuotationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const { id } = await params;

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: true,
      items: {
        orderBy: { createdAt: "asc" },
      },
      operation: true,
    },
  });

  if (!quotation) {
    notFound();
  }

  const { client, items, operation } = quotation;

  // Group items by category
  const originItems = items.filter(
    (i) => i.category === "GASTOS_ORIGEN" || i.category === "FLETE_INTERNACIONAL" || i.category === "SEGURO"
  );
  const localItems = items.filter((i) => i.category === "GASTOS_LOCALES" || !i.category);

  // Category subtotals
  const originTotalUsd = originItems
    .filter((i) => i.currency === "USD")
    .reduce((sum, i) => sum + i.total, 0);
  const originTotalPen = originItems
    .filter((i) => i.currency === "PEN")
    .reduce((sum, i) => sum + i.total, 0);

  const localTotalUsd = localItems
    .filter((i) => i.currency === "USD")
    .reduce((sum, i) => sum + i.total, 0);
  const localTotalPen = localItems
    .filter((i) => i.currency === "PEN")
    .reduce((sum, i) => sum + i.total, 0);

  // Client Tax Breakdown
  let subtotalTaxableUsd = 0;
  let totalNonTaxableUsd = 0;

  let subtotalTaxablePen = 0;
  let totalNonTaxablePen = 0;

  items.forEach((item) => {
    const salePrice = item.total;
    if (item.currency === "PEN") {
      if (item.isTaxable) {
        subtotalTaxablePen += salePrice;
      } else {
        totalNonTaxablePen += salePrice;
      }
    } else {
      if (item.isTaxable) {
        subtotalTaxableUsd += salePrice;
      } else {
        totalNonTaxableUsd += salePrice;
      }
    }
  });

  subtotalTaxableUsd = Number(subtotalTaxableUsd.toFixed(2));
  const igvUsd = Number((subtotalTaxableUsd * 0.18).toFixed(2));
  const totalTaxableUsd = Number((subtotalTaxableUsd + igvUsd).toFixed(2));
  totalNonTaxableUsd = Number(totalNonTaxableUsd.toFixed(2));
  const grandTotalUsd = Number((totalTaxableUsd + totalNonTaxableUsd).toFixed(2));

  subtotalTaxablePen = Number(subtotalTaxablePen.toFixed(2));
  const igvPen = Number((subtotalTaxablePen * 0.18).toFixed(2));
  const totalTaxablePen = Number((subtotalTaxablePen + igvPen).toFixed(2));
  totalNonTaxablePen = Number(totalNonTaxablePen.toFixed(2));
  const grandTotalPen = Number((totalTaxablePen + totalNonTaxablePen).toFixed(2));

  // Prepare data object for PDF generation
  const pdfData = {
    code: quotation.code,
    createdAt: quotation.createdAt,
    validUntil: quotation.validUntil,
    modality: quotation.modality,
    incoterm: quotation.incoterm,
    origin: quotation.origin,
    destination: quotation.destination,
    shippingType: quotation.shippingType,
    shippingLine: quotation.shippingLine,
    frequency: quotation.frequency,
    transitTime: quotation.transitTime,
    etd: quotation.etd,
    eta: quotation.eta,
    blNro: quotation.blNro,
    shipper: quotation.shipper,
    mercaderia: quotation.mercaderia,
    formaPago: quotation.formaPago,
    cargoType: quotation.cargoType,
    packagesCount: quotation.packagesCount,
    grossWeight: quotation.grossWeight,
    volume: quotation.volume,
    loadType: quotation.loadType,
    containersCount: quotation.containersCount,
    notes: quotation.notes,
    client: {
      name: client.businessName,
      documentType: client.documentType,
      documentNumber: client.documentNumber,
      email: client.email,
      phone: client.phone,
      address: client.address,
    },
    items: items.map((item) => ({
      description: item.description,
      category: item.category,
      currency: item.currency,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      total: item.total,
      isTaxable: item.isTaxable,
    })),
    subtotalTaxableUsd,
    igvUsd,
    totalTaxableUsd,
    totalNonTaxableUsd,
    grandTotalUsd,
    subtotalTaxablePen,
    igvPen,
    totalTaxablePen,
    totalNonTaxablePen,
    grandTotalPen,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full pb-12">
      {/* Top Action Navbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/quotations">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {quotation.modality || "Cotización Comercial"} #{quotation.code}
              </h1>
              <Badge variant="secondary" className="font-semibold text-xs">
                {quotation.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliente: <span className="font-semibold text-slate-800">{client.businessName}</span> • Válida hasta:{" "}
              <span className="font-semibold text-slate-800">{formatDate(quotation.validUntil)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download PDF Button */}
          <DownloadPdfButton data={pdfData} />

          {/* Convert to Operation Button */}
          <ConvertQuotationButton quotationId={quotation.id} existingOperationId={operation?.id} />
        </div>
      </div>

      {/* Official Web Quotation Document Card */}
      <div className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm space-y-8">
        {/* Document Header Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-blue-700 font-black text-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span>FORWARDER ERP - AGENCIA DE ADUANAS</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Agenciamiento Aduanero y Logística Internacional</p>
            <p className="text-xs text-slate-400">RUC: 20601335209 • Callao, Perú</p>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="inline-block border-2 border-blue-600 text-blue-900 font-mono font-black text-base px-4 py-1 rounded-md bg-blue-50/50">
              COTIZACIÓN N° {quotation.code}
            </div>
            <p className="text-xs text-slate-500 mt-1">Fecha Emisión: {formatDate(quotation.createdAt)}</p>
            <p className="text-xs text-slate-500">Válida Hasta: {formatDate(quotation.validUntil)}</p>
          </div>
        </div>

        {/* Client Salutation & Target Info */}
        <div className="bg-slate-50 p-5 rounded-xl border space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Propuesta Dirigida A:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900 text-lg">{client.businessName}</p>
            <Badge variant="outline" className="text-xs font-mono font-bold border-blue-200 text-blue-800 bg-blue-50">
              {client.documentType}: {client.documentNumber}
            </Badge>
          </div>
          {client.contactName && <p className="text-xs text-slate-600 font-medium">Attn: {client.contactName}</p>}
          <p className="text-xs text-slate-600 pt-1">
            Por medio de la presente tenemos el agrado de saludarlos y a la vez presentarles nuestra propuesta comercial para vuestro embarque según la información proporcionada:
          </p>
        </div>

        {/* Shipment Metadata Grid (Pre-Alerta Exact Headers) */}
        <div className="rounded-xl border bg-slate-50/70 p-5 space-y-3">
          <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
            <Ship className="h-4 w-4 text-blue-600" /> Datos del Embarque (Pre-Alerta Logística)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">NAVE</span>
              <p className="font-bold text-slate-800">{quotation.shippingLine || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">LUG. EMBARQUE</span>
              <p className="font-bold text-slate-800">{quotation.origin || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">E.T.D</span>
              <p className="font-semibold text-slate-800">{quotation.etd || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">E.T.A</span>
              <p className="font-semibold text-slate-800">{quotation.eta || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">BL/NRO</span>
              <p className="font-bold text-slate-800">{quotation.blNro || "-"}</p>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">BULTOS / PALETA</span>
              <p className="font-semibold text-slate-800">{quotation.packagesCount || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">PESO & VOL.</span>
              <p className="font-semibold text-slate-800">{quotation.grossWeight || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">SHIPPER</span>
              <p className="font-semibold text-slate-800">{quotation.shipper || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">MERCADERIA</span>
              <p className="font-semibold text-slate-800">{quotation.mercaderia || quotation.cargoType || "-"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">FORMA DE PAGO</span>
              <p className="font-semibold text-slate-800">{quotation.formaPago || "-"}</p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">INCOTERM</span>
              <p className="font-bold text-blue-700">{quotation.incoterm || "EXW"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">PUERTO / DESTINO</span>
              <p className="font-semibold text-slate-800">{quotation.destination || "CALLAO - PERU"}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">CONTENEDOR(ES) / FLETE</span>
              <p className="font-semibold text-slate-800">{quotation.containersCount || quotation.loadType || "-"}</p>
            </div>
          </div>
        </div>

        {/* Section 1: GASTOS DE ORIGEN (Inafectos) */}
        {originItems.length > 0 && (
          <div className="space-y-3">
            <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg font-bold text-sm uppercase tracking-wider flex items-center justify-between">
              <span>GASTOS DE ORIGEN</span>
              <span className="text-xs font-normal text-blue-200">Conceptos Inafectos a IGV</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-left">CONCEPTO / SERVICIO</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">MONEDA</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">PRECIO UNIT.</TableHead>
                    <TableHead className="font-bold text-blue-900 text-right bg-blue-50/50">MONTO USD ($)</TableHead>
                    <TableHead className="font-bold text-purple-900 text-right bg-purple-50/50">MONTO SOLES (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {originItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-slate-900 text-left">{item.description}</TableCell>
                      <TableCell className="text-center font-bold text-xs">{item.currency}</TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {formatCurrency(item.unitPrice, item.currency as any)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 bg-blue-50/20">
                        {item.currency === "USD" ? formatCurrency(item.total, "USD") : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 bg-purple-50/20">
                        {item.currency === "PEN" ? formatCurrency(item.total, "PEN") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-100 font-bold border-t-2">
                    <TableCell colSpan={3} className="text-right text-blue-900 uppercase">
                      Subtotal Gastos Origen / Flete:
                    </TableCell>
                    <TableCell className="text-right font-black text-blue-900">{formatCurrency(originTotalUsd, "USD")}</TableCell>
                    <TableCell className="text-right font-black text-purple-900">{formatCurrency(originTotalPen, "PEN")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Section 2: GASTOS DE DESTINO (Afectos IGV) */}
        {localItems.length > 0 && (
          <div className="space-y-3">
            <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg font-bold text-sm uppercase tracking-wider flex items-center justify-between">
              <span>GASTOS DE DESTINO</span>
              <span className="text-xs font-normal text-blue-200">Servicios Afectos a IGV (18%)</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-left">CONCEPTO / SERVICIO</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">MONEDA</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">PRECIO UNIT.</TableHead>
                    <TableHead className="font-bold text-blue-900 text-right bg-blue-50/50">MONTO USD ($)</TableHead>
                    <TableHead className="font-bold text-purple-900 text-right bg-purple-50/50">MONTO SOLES (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-slate-900 text-left">
                        {item.description} {item.isTaxable ? <span className="text-blue-600 font-bold text-xs">(+ IGV)</span> : ""}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs">{item.currency}</TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {formatCurrency(item.unitPrice, item.currency as any)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 bg-blue-50/20">
                        {item.currency === "USD" ? formatCurrency(item.total, "USD") : "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 bg-purple-50/20">
                        {item.currency === "PEN" ? formatCurrency(item.total, "PEN") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-100 font-bold border-t-2">
                    <TableCell colSpan={3} className="text-right text-blue-900 uppercase">
                      Subtotal Gastos Locales:
                    </TableCell>
                    <TableCell className="text-right font-black text-blue-900">{formatCurrency(localTotalUsd, "USD")}</TableCell>
                    <TableCell className="text-right font-black text-purple-900">{formatCurrency(localTotalPen, "PEN")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Observations & Client Financial Breakdown Summary */}
        <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
          {/* Observations Box */}
          <div className="rounded-xl border bg-slate-50 p-5 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Observaciones y Condiciones:</h4>
            <div className="whitespace-pre-line text-slate-600 font-mono text-[11px] leading-relaxed">
              {quotation.notes ||
                "- Tarifa sujeta a variación según volumen/peso final verificado en origen.\n- Pago a la emisión de liquidación."}
            </div>
          </div>

          {/* Grand Totals Summary Box */}
          <div className="rounded-xl bg-slate-900 text-white p-5 space-y-4">
            <h4 className="font-bold text-sky-400 text-sm border-b border-slate-700 pb-2 text-center uppercase tracking-wider">
              Resumen Propuesta Comercial (Totales)
            </h4>

            {grandTotalUsd > 0 && (
              <div className="space-y-1.5 text-xs border-b border-slate-800 pb-3">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Servicios Afectos (USD):</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(subtotalTaxableUsd, "USD")}</span>
                </div>
                <div className="flex justify-between text-sky-400 font-semibold">
                  <span>IGV 18% (USD):</span>
                  <span>{formatCurrency(igvUsd, "USD")}</span>
                </div>
                {totalNonTaxableUsd > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Gastos Origen / Inafectos (USD):</span>
                    <span className="font-semibold text-slate-200">{formatCurrency(totalNonTaxableUsd, "USD")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-black text-sm border-t border-slate-700 text-emerald-400">
                  <span>TOTAL GENERAL USD:</span>
                  <span className="text-base">{formatCurrency(grandTotalUsd, "USD")}</span>
                </div>
              </div>
            )}

            {grandTotalPen > 0 && (
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Servicios Afectos (PEN):</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(subtotalTaxablePen, "PEN")}</span>
                </div>
                <div className="flex justify-between text-purple-400 font-semibold">
                  <span>IGV 18% (PEN):</span>
                  <span>{formatCurrency(igvPen, "PEN")}</span>
                </div>
                {totalNonTaxablePen > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Gastos Origen / Inafectos (PEN):</span>
                    <span className="font-semibold text-slate-200">{formatCurrency(totalNonTaxablePen, "PEN")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-black text-sm border-t border-slate-700 text-emerald-400">
                  <span>TOTAL GENERAL PEN:</span>
                  <span className="text-base">{formatCurrency(grandTotalPen, "PEN")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
