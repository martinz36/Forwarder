"use client";

import { useState } from "react";
import { FileText, Eye, Download, X, Building2, Calendar, ShieldCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DownloadPdfButton } from "@/components/pdf/download-pdf-button";
import { QuotationPdfData } from "@/components/pdf/quotation-pdf";
import { formatCurrency, formatDate } from "@/lib/format";

interface QuotationDetailDialogProps {
  pdfData: QuotationPdfData;
  totalUsd: number;
  totalPen: number;
  buttonVariant?: "outline" | "default" | "secondary" | "ghost";
  buttonSize?: "default" | "sm" | "icon";
  buttonText?: string;
  className?: string;
}

export function QuotationDetailDialog({
  pdfData,
  totalUsd,
  totalPen,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonText = "Ver Cotización / PDF",
  className = "",
}: QuotationDetailDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={`font-semibold text-xs flex items-center gap-1.5 ${className}`}
        >
          <FileText className="h-4 w-4 text-blue-600" />
          <span>{buttonText}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Cotización N° {pdfData.code}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Propuesta comercial oficial aprobada para agenciamiento aduanero y logística internacional.
              </DialogDescription>
            </div>
            <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50 font-mono font-bold">
              {pdfData.modality || "Cotización"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Header Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border">
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Cliente:</span>
              <span className="font-bold text-slate-900 truncate block">{pdfData.client.name}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Incoterm:</span>
              <span className="font-semibold text-slate-800">{pdfData.incoterm || "FOB"}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Fecha Emisión:</span>
              <span className="font-semibold text-slate-800">{formatDate(pdfData.createdAt)}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Origen (POL):</span>
              <span className="font-medium text-slate-800 truncate block">{pdfData.origin || "-"}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Destino (POD):</span>
              <span className="font-medium text-slate-800 truncate block">{pdfData.destination || "Callao - Perú"}</span>
            </div>

            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Línea / Nave:</span>
              <span className="font-medium text-slate-800 truncate block">{pdfData.shippingLine || "-"}</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-blue-600" /> Desglose de Tarifas & Conceptos Cotizados
            </h4>

            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-2.5">Concepto / Servicio</th>
                    <th className="p-2.5 text-center">Moneda</th>
                    <th className="p-2.5 text-right">Valor Unit.</th>
                    <th className="p-2.5 text-center">Cant.</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800 font-medium">
                  {pdfData.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-semibold text-slate-900">
                        {item.description}
                        {item.isTaxable && <span className="ml-1 text-[10px] font-normal text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded">+IGV</span>}
                      </td>
                      <td className="p-2.5 text-center font-mono">{item.currency}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(item.unitPrice, item.currency as any)}</td>
                      <td className="p-2.5 text-center">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.total, item.currency as any)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200 text-slate-700 font-semibold">
                  {pdfData.subtotalTaxableUsd > 0 && (
                    <>
                      <tr>
                        <td colSpan={4} className="p-2 text-right text-[11px] text-slate-500">Subtotal Servicios Locales (Afectos):</td>
                        <td className="p-2 text-right font-mono text-xs text-slate-900">{formatCurrency(pdfData.subtotalTaxableUsd, "USD")}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="p-2 text-right text-[11px] text-blue-700">I.G.V. (18%):</td>
                        <td className="p-2 text-right font-mono text-xs text-blue-700 font-bold">{formatCurrency(pdfData.igvUsd, "USD")}</td>
                      </tr>
                    </>
                  )}
                  {pdfData.totalNonTaxableUsd > 0 && (
                    <tr>
                      <td colSpan={4} className="p-2 text-right text-[11px] text-slate-500">Gastos Inafectos (Origen / Flete):</td>
                      <td className="p-2 text-right font-mono text-xs text-slate-900">{formatCurrency(pdfData.totalNonTaxableUsd, "USD")}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                    <td colSpan={4} className="p-2.5 text-right text-xs text-slate-900">TOTAL FINAL APROBADO (USD):</td>
                    <td className="p-2.5 text-right font-mono text-sm text-emerald-700 font-black">{formatCurrency(pdfData.grandTotalUsd, "USD")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Financial Totals Summary Card */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Cotizado Aprobado</span>
              <p className="text-xs text-slate-300">Incluye gastos de origen, flete y agenciamiento aduanero.</p>
            </div>

            <div className="text-right font-mono font-black text-lg text-emerald-400 flex items-center gap-4">
              <span>{formatCurrency(pdfData.grandTotalUsd, "USD")}</span>
              {pdfData.grandTotalPen > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <span>{formatCurrency(pdfData.grandTotalPen, "PEN")}</span>
                </>
              )}
            </div>
          </div>

          {/* PDF Download Section */}
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-xs text-slate-500">¿Necesitas el formato impreso oficial?</span>
            <DownloadPdfButton data={pdfData} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
