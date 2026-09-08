import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, FileText, MapPin, Receipt, TrendingUp, User, Pencil } from "lucide-react";
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

  // Calculate Client Tax Breakdown
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Action Navbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/quotations">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Cotización Comercial #{quotation.code}
              </h1>
              <Badge variant="secondary" className="font-semibold text-xs">
                {quotation.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Cliente: <span className="font-semibold text-slate-800">{client.businessName}</span> • Válida hasta: <span className="font-semibold text-slate-800">{formatDate(quotation.validUntil)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Edit Quotation Button */}
          <Link href={`/quotations/${quotation.id}/edit`}>
            <Button variant="outline" size="sm" className="h-9 font-semibold text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5">
              <Pencil className="h-4 w-4" /> Editar
            </Button>
          </Link>

          {/* Download PDF Button */}
          <DownloadPdfButton data={pdfData} />

          {/* Convert to Operation Button */}
          <ConvertQuotationButton
            quotationId={quotation.id}
            existingOperationId={operation?.id}
          />
        </div>
      </div>

      {/* Financial Summary Card for Client */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 border-b pb-3">
          <Receipt className="h-5 w-5 text-blue-600" /> Resumen Propuesta Comercial (Vista Cliente)
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* USD Summary */}
          <div className="rounded-xl bg-blue-50/50 p-5 border border-blue-100 space-y-3">
            <span className="font-bold text-sm text-blue-900 flex items-center gap-1.5 border-b border-blue-200 pb-2">
              Cobro en Dólares (USD $)
            </span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Servicios (Afectos IGV):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(subtotalTaxableUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center text-blue-700 font-bold">
                <span>IGV (18% Ley Peruana):</span>
                <span className="text-right">{formatCurrency(igvUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Reembolsos (Inafectos):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(totalNonTaxableUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="font-black text-slate-900 text-base">TOTAL A PAGAR USD:</span>
                <span className="font-black text-blue-700 text-xl text-right">{formatCurrency(grandTotalUsd, "USD")}</span>
              </div>
            </div>
          </div>

          {/* PEN Summary */}
          <div className="rounded-xl bg-purple-50/50 p-5 border border-purple-100 space-y-3">
            <span className="font-bold text-sm text-purple-900 flex items-center gap-1.5 border-b border-purple-200 pb-2">
              Cobro en Soles (PEN S/)
            </span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Servicios (Afectos IGV):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(subtotalTaxablePen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center text-purple-700 font-bold">
                <span>IGV (18% Ley Peruana):</span>
                <span className="text-right">{formatCurrency(igvPen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Reembolsos (Inafectos):</span>
                <span className="font-semibold text-slate-800 text-right">{formatCurrency(totalNonTaxablePen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                <span className="font-black text-slate-900 text-base">TOTAL A PAGAR PEN:</span>
                <span className="font-black text-purple-700 text-xl text-right">{formatCurrency(grandTotalPen, "PEN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Broker Profit Panel */}
      <div className="rounded-2xl border bg-slate-950 text-white p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="rounded-xl bg-emerald-500/20 p-3 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl leading-tight">Panel de Rentabilidad Interna (Broker Profit)</h3>
            <p className="text-xs text-slate-400">Margen real proyectado de la operación</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* USD Profit */}
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-300">Margen Dólares (USD)</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {quotation.totalUsd > 0 ? ((quotation.profitUsd / quotation.totalUsd) * 100).toFixed(1) : "0.0"}% Margen
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Venta Total:</span>
                <span className="font-bold text-white text-right">{formatCurrency(quotation.totalUsd, "USD")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-emerald-400 text-base">Profit USD:</span>
                <span className="font-black text-emerald-400 text-xl text-right">{formatCurrency(quotation.profitUsd, "USD")}</span>
              </div>
            </div>
          </div>

          {/* PEN Profit */}
          <div className="rounded-xl bg-slate-900 p-5 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-sm text-slate-300">Margen Soles (PEN)</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {quotation.totalPen > 0 ? ((quotation.profitPen / quotation.totalPen) * 100).toFixed(1) : "0.0"}% Margen
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Venta Total:</span>
                <span className="font-bold text-white text-right">{formatCurrency(quotation.totalPen, "PEN")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="font-bold text-emerald-400 text-base">Profit PEN:</span>
                <span className="font-black text-emerald-400 text-xl text-right">{formatCurrency(quotation.profitPen, "PEN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Table */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" /> Desglose de Servicios e Impuestos
        </h3>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 text-left">Concepto / Servicio</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Moneda</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Cant.</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Precio Unit. ($/S/)</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Subtotal ($/S/)</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Afecto IGV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-800 text-left">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs">
                    {item.currency}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-700">
                    {formatCurrency(item.unitPrice, item.currency as "USD" | "PEN")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {formatCurrency(item.total, item.currency as "USD" | "PEN")}
                  </TableCell>
                  <TableCell className="text-center">
                    {item.isTaxable ? (
                      <Badge className="bg-blue-100 text-blue-800 font-medium text-xs">
                        Afecto 18%
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 font-medium text-xs">
                        Inafecto
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
