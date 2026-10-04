"use client";

import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptPDF, ReceiptPdfData } from "@/components/pdf/receipt-pdf";

interface DownloadReceiptButtonProps {
  data: ReceiptPdfData;
  filename?: string;
}

export function DownloadReceiptButton({ data, filename }: DownloadReceiptButtonProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const defaultFilename = filename || `Recibo_Reembolso_${data.receiptNumber.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

  if (!isClient) {
    return (
      <Button disabled variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/50">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando Recibo...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<ReceiptPDF data={data} />}
      fileName={defaultFilename}
      className="inline-block"
    >
      {({ loading }) => (
        <Button
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold shadow transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando Recibo PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Descargar Recibo Interno PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
