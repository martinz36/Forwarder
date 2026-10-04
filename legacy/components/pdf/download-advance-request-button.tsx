"use client";

import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdvanceRequestPDF, AdvanceRequestPdfData } from "@/components/pdf/advance-request-pdf";

interface DownloadAdvanceRequestButtonProps {
  data: AdvanceRequestPdfData;
  filename?: string;
  disabled?: boolean;
}

export function DownloadAdvanceRequestButton({
  data,
  filename,
  disabled = false,
}: DownloadAdvanceRequestButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const defaultFilename =
    filename ||
    `Solicitud_Anticipo_${(data.externalCode || data.operationCode).replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

  if (!isClient) {
    return (
      <Button disabled variant="outline" size="sm" className="h-8 text-xs border-sky-300 text-sky-700 bg-sky-50">
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> PDF...
      </Button>
    );
  }

  if (disabled || data.items.length === 0) {
    return (
      <Button
        disabled
        variant="outline"
        size="sm"
        title="Selecciona al menos un concepto como Anticipo para generar el PDF"
        className="h-8 text-xs border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
      >
        <FileText className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> Solicitud de Anticipo (PDF)
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<AdvanceRequestPDF data={data} />}
      fileName={defaultFilename}
      className="inline-block"
    >
      {({ loading }) => (
        <Button
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-8 text-xs border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold shadow-sm transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-sky-600" /> Generando PDF...
            </>
          ) : (
            <>
              <FileText className="mr-1.5 h-3.5 w-3.5 text-sky-600" /> Solicitud de Anticipo (PDF)
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
