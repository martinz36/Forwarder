"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { generateReceiptAction } from "@/app/liquidations/actions";
import { DownloadReceiptButton } from "@/components/pdf/download-receipt-button";
import { ReceiptPdfData } from "@/components/pdf/receipt-pdf";

interface EmitReceiptButtonProps {
  liquidationId: string;
  receiptNumber?: string | null;
  totalNonTaxableUsd: number;
  totalNonTaxablePen: number;
  receiptPdfData?: ReceiptPdfData | null;
}

export function EmitReceiptButton({
  liquidationId,
  receiptNumber,
  totalNonTaxableUsd,
  totalNonTaxablePen,
  receiptPdfData,
}: EmitReceiptButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasReceipt = Boolean(receiptNumber);

  async function handleGenerateReceipt() {
    try {
      setLoading(true);
      setError(null);
      await generateReceiptAction(liquidationId);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al generar el recibo.");
    } finally {
      setLoading(false);
    }
  }

  if (hasReceipt && receiptPdfData) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm dark:bg-amber-950/20 dark:border-amber-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
            <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            Recibo Interno de Reembolso: {receiptNumber}
          </h3>
          <Badge className="w-fit bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-1">
            CONTROL INTERNO ERP 📄
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-400">
          Documento interno emitido exclusivamente para sustentar el cobro de reembolsos inafectos por cuenta de terceros. No se transmite a SUNAT / OSE.
        </p>
        <div className="pt-2">
          <DownloadReceiptButton data={receiptPdfData} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base sm:text-lg text-amber-950 dark:text-amber-200 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600 shrink-0" />
            Recibo Interno de Reembolso (Pagos Terceros Inafectos)
          </h3>
          <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-800 bg-amber-100">
            NO SUNAT
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-amber-800/80 dark:text-amber-400 mt-1">
          Genera el recibo interno para cobro de flete, tributos y gastos inafectos. Total Inafecto:{" "}
          <span className="font-bold text-amber-950">${totalNonTaxableUsd.toFixed(2)} USD</span> /{" "}
          <span className="font-bold text-amber-950">S/{totalNonTaxablePen.toFixed(2)} PEN</span>.
        </p>
        {error && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>
      <Button
        onClick={handleGenerateReceipt}
        disabled={loading}
        size="lg"
        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow shrink-0"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generando Recibo...
          </>
        ) : (
          <>
            <Receipt className="w-4 h-4 mr-2" />
            Generar Recibo de Reembolso
          </>
        )}
      </Button>
    </div>
  );
}
