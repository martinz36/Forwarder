"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, CheckCircle2, Download, AlertCircle } from "lucide-react";
import { emitInvoiceAction } from "@/app/liquidations/actions";

interface EmitInvoiceButtonProps {
  liquidationId: string;
  status: string;
  invoiceNumber?: string | null;
  sunatPdfUrl?: string | null;
  sunatCdrStatus?: string | null;
  sunatNotes?: string | null;
}

export function EmitInvoiceButton({
  liquidationId,
  status,
  invoiceNumber,
  sunatPdfUrl,
  sunatCdrStatus,
  sunatNotes,
}: EmitInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBilled = status === "BILLED" || Boolean(invoiceNumber);

  async function handleEmitInvoice() {
    try {
      setLoading(true);
      setError(null);
      await emitInvoiceAction(liquidationId);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al emitir el comprobante.");
    } finally {
      setLoading(false);
    }
  }

  if (isBilled) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Comprobante Electrónico SUNAT: {invoiceNumber}
          </h3>
          <Badge className="w-fit bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3 py-1">
            ESTADO SUNAT: {sunatCdrStatus || "ACEPTADO"} 🟢
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
          {sunatNotes || "El comprobante electrónico ha sido procesado y aceptado oficialmente por SUNAT."}
        </p>
        {sunatPdfUrl && (
          <div className="pt-2">
            <a
              href={sunatPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Factura PDF
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
          Emisión de Factura Electrónica (SUNAT)
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Genera la factura oficial afectando únicamente los conceptos imponibles (Servicios de agenciamiento/flete).
        </p>
        {error && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>
      <Button
        onClick={handleEmitInvoice}
        disabled={loading}
        size="lg"
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow shrink-0"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Emitiendo en SUNAT...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Emitir Comprobante (SUNAT)
          </>
        )}
      </Button>
    </div>
  );
}
