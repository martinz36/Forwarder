"use client";

import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuotationPDF, QuotationPdfData } from "@/components/pdf/quotation-pdf";

interface DownloadPdfButtonProps {
  data: QuotationPdfData;
  filename?: string;
}

export function DownloadPdfButton({ data, filename }: DownloadPdfButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const defaultFilename = filename || `Cotizacion_${data.code.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

  if (!isClient) {
    return (
      <Button disabled variant="outline" className="border-blue-200 text-blue-700 bg-blue-50/50">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando PDF...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<QuotationPDF data={data} />}
      fileName={defaultFilename}
      className="inline-block"
    >
      {({ loading, error }) => (
        <Button
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando Documento PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Descargar Cotización PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
