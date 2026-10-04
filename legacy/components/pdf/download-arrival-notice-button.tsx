"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrivalNoticePDF, ArrivalNoticePdfData } from "@/components/pdf/arrival-notice-pdf";

interface DownloadArrivalNoticeButtonProps {
  data: ArrivalNoticePdfData;
}

export function DownloadArrivalNoticeButton({ data }: DownloadArrivalNoticeButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filename = `Aviso_Llegada_${data.operationCode.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

  if (!isClient) {
    return (
      <Button variant="outline" size="sm" disabled className="h-9 gap-1.5 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando Aviso...</span>
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<ArrivalNoticePDF data={data} />}
      fileName={filename}
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
              <FileText className="h-4 w-4 text-amber-600" />
              <span>Generar Aviso de Llegada (PDF)</span>
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
