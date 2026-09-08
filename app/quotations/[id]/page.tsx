import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Calendar, FileText, MapPin, Receipt, TrendingUp, User } from "lucide-react";
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
      name: client.name,
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
              Cliente: <span className="font-semibold text-slate-800">{client.name}</span> • Válida hasta: <span className="font-semibold text-slate-800">{formatDate(quotation.validUntil)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download PDF Button */}
          <DownloadPdfButton data={pdfData} />

          {/* Convert to Operation Button */}
          <ConvertQuotationButton
            quotationId={quotation.id}
            existingOperationId={operation?.id}
          />
        </div>
      </div>

      {/* Official Web Quotation Document Card */}
      <div className="rounded-2xl border bg-white p-8 shadow-sm space-y-8">
        {/* Document Header Section */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-black text-xl">
              <Building2 className="h-6 w-6" />
              <span>AGENCIA DE ADUANAS & LOGÍSTICA S.A.C.</span>
            </div>
            <p className="text-xs text-slate-500">RUC: 20601234567 • Callao, Perú</p>
            <p className="text-xs text-slate-500">Propuesta de Servicios de Comercio Exterior</p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <Badge variant="outline" className="text-xs font-bold border-blue-200 text-blue-700 bg-blue-50">
              {quotation.code}
            </Badge>
            <p className="text-xs text-slate-500">
              Fecha Emisión: {formatDate(quotation.createdAt)}
            </p>
            <p className="text-xs text-slate-500">
              Válida Hasta: {formatDate(quotation.validUntil)}
            </p>
          </div>
        </div>

        {/* Client Details Grid */}
        <div className="bg-slate-50 p-4 rounded-xl border text-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Propuesta Preparada Para (Cliente)</span>
          <p className="font-bold text-slate-900 text-base">{client.name}</p>
          {client.address && (
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {client.address}
            </p>
          )}
          {client.phone && <p className="text-xs text-slate-500">Teléfono: {client.phone}</p>}
          {client.email && <p className="text-xs text-slate-500">Email: {client.email}</p>}
        </div>

        {/* Quotation Concept Items Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Conceptos y Tarifas Cotizadas
          </h3>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 text-left">Concepto / Servicio</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Moneda</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Cant.</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Precio Unit.</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-900 text-left">
                      <div>{item.description}</div>
                      <span className={`text-[10px] font-bold ${item.isTaxable ? "text-blue-600" : "text-amber-600"}`}>
                        {item.isTaxable ? "* Afecto a IGV (18%)" : "• Inafecto / Reembolso"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-xs">{item.currency}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right text-slate-600 font-medium">
                      {formatCurrency(item.unitPrice, item.currency as any)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">
                      {formatCurrency(item.total, item.currency as any)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Client Tax & Financial Summary Box */}
        <div className="grid gap-6 md:grid-cols-2 pt-4 border-t">
          {/* USD Summary Box */}
          {grandTotalUsd > 0 && (
            <div className="rounded-xl bg-blue-50/50 p-5 border border-blue-100 space-y-3">
              <span className="font-bold text-sm text-blue-900 flex items-center gap-1.5 border-b border-blue-200 pb-2">
                Resumen de Cobro en Dólares (USD $)
              </span>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal Servicios Afectos:</span>
                  <span className="font-semibold text-slate-800 text-right">{formatCurrency(subtotalTaxableUsd, "USD")}</span>
                </div>
                <div className="flex justify-between items-center text-blue-700 font-bold">
                  <span>IGV (18% Ley Peruana):</span>
                  <span className="text-right">{formatCurrency(igvUsd, "USD")}</span>
                </div>
                {totalNonTaxableUsd > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal Reembolsos (Inafectos):</span>
                    <span className="font-semibold text-slate-800 text-right">{formatCurrency(totalNonTaxableUsd, "USD")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="font-black text-slate-900 text-sm sm:text-base">TOTAL GENERAL USD:</span>
                  <span className="font-black text-blue-700 text-lg sm:text-xl text-right">{formatCurrency(grandTotalUsd, "USD")}</span>
                </div>
              </div>
            </div>
          )}

          {/* PEN Summary Box */}
          {grandTotalPen > 0 && (
            <div className="rounded-xl bg-purple-50/50 p-5 border border-purple-100 space-y-3">
              <span className="font-bold text-sm text-purple-900 flex items-center gap-1.5 border-b border-purple-200 pb-2">
                Resumen de Cobro en Soles (PEN S/)
              </span>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal Servicios Afectos:</span>
                  <span className="font-semibold text-slate-800 text-right">{formatCurrency(subtotalTaxablePen, "PEN")}</span>
                </div>
                <div className="flex justify-between items-center text-purple-700 font-bold">
                  <span>IGV (18% Ley Peruana):</span>
                  <span className="text-right">{formatCurrency(igvPen, "PEN")}</span>
                </div>
                {totalNonTaxablePen > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Subtotal Reembolsos (Inafectos):</span>
                    <span className="font-semibold text-slate-800 text-right">{formatCurrency(totalNonTaxablePen, "PEN")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                  <span className="font-black text-slate-900 text-sm sm:text-base">TOTAL GENERAL PEN:</span>
                  <span className="font-black text-purple-700 text-lg sm:text-xl text-right">{formatCurrency(grandTotalPen, "PEN")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
