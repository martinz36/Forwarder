"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  Send,
  Loader2,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { emitInvoiceAction, generateReceiptAction } from "@/app/liquidations/actions";
import { ReceiptPDF, ReceiptPdfData } from "@/components/pdf/receipt-pdf";

interface LiquidationHeaderActionsProps {
  liquidationId: string;
  status: string;
  invoiceNumber?: string | null;
  sunatPdfUrl?: string | null;
  sunatCdrStatus?: string | null;
  receiptNumber?: string | null;
  receiptPdfData?: ReceiptPdfData | null;
}

export function LiquidationHeaderActions({
  liquidationId,
  status,
  invoiceNumber,
  sunatPdfUrl,
  sunatCdrStatus,
  receiptNumber,
  receiptPdfData,
}: LiquidationHeaderActionsProps) {
  const [isClient, setIsClient] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isBilled = status === "BILLED" || Boolean(invoiceNumber);

  const handleEmitComprobantes = async () => {
    try {
      setIsEmitting(true);
      setError(null);
      // Emit SUNAT invoice
      await emitInvoiceAction(liquidationId);
      // Generate internal receipt
      await generateReceiptAction(liquidationId);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al emitir los comprobantes.");
    } finally {
      setIsEmitting(false);
    }
  };

  if (!isBilled) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
        {error && (
          <span className="text-xs text-red-600 flex items-center gap-1 font-medium">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </span>
        )}
        <Button
          onClick={handleEmitComprobantes}
          disabled={isEmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm h-9 gap-2"
        >
          {isEmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Emitiendo Comprobantes...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Emitir Comprobantes (SUNAT)</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Discrete SUNAT Status & Voucher Badges */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold text-xs py-1 px-2.5 gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>SUNAT: {sunatCdrStatus || "ACEPTADO"}</span>
        </Badge>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          <span>Factura: <strong>{invoiceNumber}</strong></span>
          {receiptNumber && (
            <>
              <span>•</span>
              <span>Recibo: <strong>{receiptNumber}</strong></span>
            </>
          )}
        </div>
      </div>

      {/* PDF Action Buttons */}
      <div className="flex items-center gap-2">
        {/* SUNAT Invoice PDF Button */}
        {sunatPdfUrl ? (
          <a href={sunatPdfUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-100 font-medium"
            >
              <FileText className="h-4 w-4 text-blue-600" />
              <span>Descargar Factura PDF</span>
            </Button>
          </a>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-9 gap-1.5 text-slate-400 border-slate-200"
          >
            <FileText className="h-4 w-4" />
            <span>Factura PDF</span>
          </Button>
        )}

        {/* Internal Receipt PDF Button */}
        {receiptPdfData && isClient ? (
          <PDFDownloadLink
            document={<ReceiptPDF data={receiptPdfData} />}
            fileName={`Recibo_Reembolso_${receiptPdfData.receiptNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`}
            className="inline-block"
          >
            {({ loading }) => (
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-9 gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-100 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 text-amber-600" />
                    <span>Descargar Recibo PDF</span>
                  </>
                )}
              </Button>
            )}
          </PDFDownloadLink>
        ) : receiptNumber ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-9 gap-1.5 text-slate-400 border-slate-200"
          >
            <ReceiptIcon className="h-4 w-4" />
            <span>Recibo PDF</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
