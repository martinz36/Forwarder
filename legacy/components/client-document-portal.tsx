"use client";

import React, { useState } from "react";
import { MarivanLogo } from "@/components/ui/marivan-logo";
import { UploadCloud, FileText, Download, Eye, ShieldCheck, UserCheck, Anchor, AlertCircle, CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUploadThing } from "@/lib/uploadthing";
import { createDocumentAction } from "@/app/operations/documents-actions";
import { formatDate } from "@/lib/format";

import { QuotationDetailDialog } from "@/components/quotation-detail-dialog";
import { QuotationPdfData } from "@/components/pdf/quotation-pdf";
import { formatCurrency } from "@/lib/format";

interface DocumentItem {
  id: string;
  name: string;
  fileUrl: string;
  documentType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface ClientDocumentPortalProps {
  operationId: string;
  token: string;
  operationCode: string;
  clientName: string;
  blNumber?: string | null;
  etd?: Date | null;
  eta?: Date | null;
  status: string;
  customsChannel?: string | null;
  documents: DocumentItem[];
  quotationPdfData?: QuotationPdfData;
  quotationTotalUsd?: number;
  quotationTotalPen?: number;
}

const statusLabelMap: Record<string, string> = {
  COORDINANDO_ORIGEN: "Coordinación Logística en Origen",
  POR_RECOGER: "Pendiente de Recojo en Proveedor",
  EN_ALMACEN_ORIGEN: "En Almacén / Terminal de Origen",
  EN_TRANSITO: "En Tránsito Internacional",
  EN_ADUANA_DESTINO: "En Proceso de Despacho Aduanero",
  EN_REPARTO: "En Reparto / Transporte Local",
  ENTREGADO: "Mercancía Entregada en Almacén",
  LIQUIDADO: "Despacho Liquidado & Finalizado",
  EN_ADUANA: "En Aduana",
  RETIRADO: "Carga Retirada",
};

export function ClientDocumentPortal({
  operationId,
  token,
  operationCode,
  clientName,
  blNumber,
  etd,
  eta,
  status,
  customsChannel,
  documents,
  quotationPdfData,
  quotationTotalUsd,
  quotationTotalPen,
}: ClientDocumentPortalProps) {
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<"FACTURA_COMERCIAL" | "PACKING_LIST" | "BL" | "OTRO">("FACTURA_COMERCIAL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        const uploadedUrl = res[0].url;
        try {
          await createDocumentAction({
            operationId,
            name: docName.trim(),
            fileUrl: uploadedUrl,
            documentType: docType,
            uploadedBy: "CLIENT",
          });
          setSelectedFile(null);
          setDocName("");
          alert("✓ Documento subido y enviado al agente exitosamente.");
        } catch (err: any) {
          alert(err.message || "Error al registrar el documento.");
        }
      }
    },
    onUploadError: (error: Error) => {
      alert(`Error en la carga: ${error.message}`);
    },
  });

  const brokerDocs = documents.filter((d) => d.uploadedBy === "BROKER");
  const clientDocs = documents.filter((d) => d.uploadedBy === "CLIENT");

  const isMetadataValid = docName.trim().length > 0;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  async function handleUploadClick() {
    if (!docName.trim()) {
      alert("Por favor ingresa primero el nombre del documento.");
      return;
    }
    if (!selectedFile) {
      alert("Por favor selecciona un archivo de tu dispositivo.");
      return;
    }
    await startUpload([selectedFile]);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 antialiased">
      {/* Brand Header Navbar */}
      <header className="border-b bg-slate-900 text-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <MarivanLogo variant="white" size="md" />
          <Badge variant="outline" className="text-xs border-slate-700 text-slate-300">
            {clientName}
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Status Card Banner (Zero financial info) */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Operación / Expediente
              </span>
              <h2 className="text-2xl font-black text-slate-900">{operationCode}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white text-xs px-3 py-1 font-semibold">
                {statusLabelMap[status] || status}
              </Badge>
              {customsChannel && (
                <Badge
                  className={
                    customsChannel === "VERDE"
                      ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 px-3 py-1 font-semibold"
                      : customsChannel === "NARANJA"
                      ? "bg-amber-500/15 text-amber-700 border-amber-500/30 px-3 py-1 font-semibold"
                      : "bg-red-500/15 text-red-700 border-red-500/30 px-3 py-1 font-semibold"
                  }
                >
                  CANAL {customsChannel}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-50 p-3 rounded-lg border">
              <span className="text-xs text-slate-500 font-medium block">BL / Guía de Carga</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {blNumber || "En trámite de emisión"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border">
              <span className="text-xs text-slate-500 font-medium block">Fecha Salida (ETD)</span>
              <span className="font-semibold text-slate-800 text-sm">
                {formatDate(etd)}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border">
              <span className="text-xs text-slate-500 font-medium block">Llegada Estimada (ETA)</span>
              <span className="font-semibold text-slate-800 text-sm">
                {formatDate(eta)}
              </span>
            </div>
          </div>
        </div>

        {/* Quotation & Approved Commercial Proposal Banner */}
        {quotationPdfData && (
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  Cotización Comercial Aprobada
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Cotización N° {operationCode}
                </h3>
                <p className="text-xs text-slate-600 font-mono">
                  Monto Aprobado: <strong>{formatCurrency(quotationTotalUsd, "USD")}</strong>
                  {quotationTotalPen && quotationTotalPen > 0 ? ` • ${formatCurrency(quotationTotalPen, "PEN")}` : ""}
                </p>
              </div>
            </div>

            <QuotationDetailDialog
              pdfData={quotationPdfData}
              totalUsd={quotationTotalUsd || 0}
              totalPen={quotationTotalPen || 0}
              buttonText="Ver Cotización Completa / PDF"
              buttonVariant="default"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow px-4 py-2"
            />
          </div>
        )}

        {/* Broker Final Documents Download Section */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> Documentos Finales Emitidos por el Agente
          </h3>

          {brokerDocs.length === 0 ? (
            <div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
              Aún no hay documentos definitivos publicados por tu agente de aduanas.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {brokerDocs.map((doc) => (
                <div key={doc.id} className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1 min-w-0 pr-2">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {doc.documentType}
                    </Badge>
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{doc.name}</h4>
                    <p className="text-[11px] text-slate-400">Fecha: {formatDate(doc.uploadedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 font-medium text-xs">
                        <Eye className="mr-1 h-3.5 w-3.5" /> Ver Online
                      </Button>
                    </a>
                    <a
                      href={doc.fileUrl}
                      download={doc.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs">
                        <Download className="mr-1 h-3.5 w-3.5" /> Descargar
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Intuitive Upload Form Section (Client Upload) */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 border-b pb-3">
            <UploadCloud className="h-5 w-5 text-blue-600" /> Adjuntar Comprobantes y Documentos de Importación
          </h3>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">1. Nombre del Archivo *</Label>
              <Input
                placeholder="Ej: Factura Comercial #1234, Packing List..."
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">2. Tipo de Documento *</Label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="FACTURA_COMERCIAL">Factura Comercial</option>
                <option value="PACKING_LIST">Packing List</option>
                <option value="BL">BL / Conocimiento de Embarque</option>
                <option value="OTRO">Otro Adjunto</option>
              </select>
            </div>
          </div>

          {/* File Picker & Action Area */}
          <div className="space-y-4 pt-2">
            <Label className="text-xs font-semibold text-slate-700">3. Selecciona el archivo físico *</Label>

            {!isMetadataValid ? (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center text-xs text-amber-800 flex flex-col items-center gap-1.5">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="font-semibold">Escribe primero el Nombre del Archivo arriba para habilitar la selección de documento.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="file"
                  id="clientFileInput"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
                  onChange={handleFileChange}
                />

                {!selectedFile ? (
                  <label
                    htmlFor="clientFileInput"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-blue-400 bg-blue-50/30 hover:bg-blue-50/70 rounded-xl p-8 cursor-pointer transition-colors text-center"
                  >
                    <FileUp className="h-10 w-10 text-blue-600 mb-2" />
                    <span className="font-bold text-blue-900 text-sm">
                      Haz clic aquí para seleccionar el archivo desde tu dispositivo
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      PDF, Imágenes o Excel (Máx 8MB)
                    </span>
                  </label>
                ) : (
                  <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-600 text-white p-2 shrink-0">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-800 uppercase block">Archivo Listo para Subir</span>
                        <p className="font-bold text-slate-900 text-sm truncate max-w-md">
                          {selectedFile.name}
                        </p>
                        <span className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</span>
                      </div>
                    </div>

                    <label
                      htmlFor="clientFileInput"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer underline text-right"
                    >
                      Cambiar archivo
                    </label>
                  </div>
                )}

                {/* Explicit Submit Button */}
                {selectedFile && (
                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 text-sm w-full sm:w-auto shadow-md"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo y Guardando...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mr-2 h-4 w-4" /> 📤 Guardar y Enviar Documento al Agente
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Client Own Uploaded Documents */}
        {clientDocs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-600" /> Documentos Enviados por Ti ({clientDocs.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clientDocs.map((doc) => (
                <div key={doc.id} className="rounded-xl border bg-white p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1 min-w-0 pr-2">
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {doc.documentType}
                    </Badge>
                    <h4 className="font-semibold text-slate-900 text-sm truncate">{doc.name}</h4>
                    <p className="text-[11px] text-slate-400">Subido: {formatDate(doc.uploadedAt)}</p>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="outline" className="text-xs">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Ver Archivo
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
