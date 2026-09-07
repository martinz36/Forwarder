"use client";

import { useState, useTransition } from "react";
import { Link2, Copy, Check, FileText, Download, Trash2, UploadCloud, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UploadDropzone } from "@/lib/uploadthing";
import { createDocumentAction, deleteDocumentAction } from "@/app/operations/documents-actions";
import { formatDate } from "@/lib/format";

interface DocumentItem {
  id: string;
  name: string;
  fileUrl: string;
  documentType: "BL" | "FACTURA_COMERCIAL" | "PACKING_LIST" | "DAM" | "LIQUIDACION" | "OTRO";
  uploadedBy: string;
  uploadedAt: Date;
}

interface BrokerDocumentSectionProps {
  operationId: string;
  sharedToken: string;
  documents: DocumentItem[];
}

export function BrokerDocumentSection({
  operationId,
  sharedToken,
  documents,
}: BrokerDocumentSectionProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<"BL" | "FACTURA_COMERCIAL" | "PACKING_LIST" | "DAM" | "LIQUIDACION" | "OTRO">("BL");
  const [isUploading, setIsUploading] = useState(false);

  const sharedLink = typeof window !== "undefined"
    ? `${window.location.origin}/shared/${sharedToken}`
    : `/shared/${sharedToken}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(sharedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleDelete(documentId: string) {
    if (!confirm("¿Deseas eliminar este documento del expediente?")) return;
    startTransition(async () => {
      await deleteDocumentAction(documentId, operationId);
    });
  }

  const isMetadataValid = docName.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Featured Client Shared Link Banner */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2.5 text-white shadow">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Portal Público del Cliente (Shared Link)
              </h3>
              <p className="text-xs text-slate-600">
                Comparte este enlace seguro con el importador para que vea el estado de su carga y descargue documentos.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCopyLink}
            className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-4 w-4 text-emerald-300" /> ¡Enlace Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-4 w-4" /> Copiar Enlace del Cliente
              </>
            )}
          </Button>
        </div>

        <div className="bg-white/80 p-2.5 rounded-lg border text-xs font-mono text-slate-700 truncate">
          {sharedLink}
        </div>
      </div>

      {/* UploadThing Upload Zone (Broker) */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b pb-3">
          <UploadCloud className="h-5 w-5 text-blue-600" /> Subida de Archivo Real al Expediente (Broker)
        </h3>

        {/* Step 1: Input Metadata */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">1. Nombre del Documento *</Label>
            <Input
              placeholder="Ej: Bill of Lading (BL) Final, DUA Aduanera, Liquidación..."
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
              <option value="BL">BL (Bill of Lading)</option>
              <option value="DAM">DAM / DUA Aduanera</option>
              <option value="LIQUIDACION">Liquidación de Tributos</option>
              <option value="FACTURA_COMERCIAL">Factura Comercial</option>
              <option value="PACKING_LIST">Packing List</option>
              <option value="OTRO">Otro Documento</option>
            </select>
          </div>
        </div>

        {/* Step 2: UploadDropzone (Conditional Locking) */}
        <div className="pt-2">
          {!isMetadataValid ? (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center text-xs text-amber-800 flex flex-col items-center gap-1.5">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-semibold">Escribe primero el Nombre del Documento arriba para habilitar la zona de carga de archivo.</span>
            </div>
          ) : (
            <div className="border border-blue-100 rounded-xl bg-slate-50 p-2">
              <UploadDropzone
                endpoint="documentUploader"
                onUploadBegin={() => setIsUploading(true)}
                onClientUploadComplete={async (res) => {
                  setIsUploading(false);
                  if (res && res[0]) {
                    const uploadedUrl = res[0].url;
                    try {
                      await createDocumentAction({
                        operationId,
                        name: docName.trim(),
                        fileUrl: uploadedUrl,
                        documentType: docType,
                        uploadedBy: "BROKER",
                      });
                      setDocName("");
                      alert("Documento subido y registrado exitosamente.");
                    } catch (err: any) {
                      alert(err.message || "Error al registrar el documento.");
                    }
                  }
                }}
                onUploadError={(error: Error) => {
                  setIsUploading(false);
                  alert(`Error en UploadThing: ${error.message}`);
                }}
                appearance={{
                  container: "border-2 border-dashed border-blue-400 bg-white hover:bg-blue-50/40 rounded-xl p-4 transition-colors cursor-pointer",
                  label: "text-blue-600 font-bold text-sm",
                  allowedContent: "text-slate-500 text-xs",
                  button: "bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-md transition-colors",
                }}
                content={{
                  label: `Arrastra aquí el archivo para "${docName.trim()}"`,
                  allowedContent: "Archivos PDF, Imágenes o Excel (Máx 8MB)",
                  button({ ready, isUploading }) {
                    if (isUploading) return "Subiendo a la nube...";
                    if (ready) return "Seleccionar Archivo";
                    return "Cargando...";
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
          <span>Expediente Documentario Integrado</span>
          <span className="text-xs font-normal text-slate-500">{documents.length} archivos registrados</span>
        </h3>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
            No se han subido documentos aún. Escribe el nombre del documento y usa la zona de carga de arriba.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                      {doc.documentType}
                    </Badge>

                    {doc.uploadedBy === "BROKER" ? (
                      <Badge className="bg-blue-100 text-blue-800 text-[10px] font-medium border-blue-200">
                        <ShieldCheck className="mr-1 h-3 w-3" /> Broker
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-100 text-purple-800 text-[10px] font-medium border-purple-200">
                        <UserCheck className="mr-1 h-3 w-3" /> Cliente
                      </Badge>
                    )}
                  </div>

                  <h4 className="font-semibold text-slate-900 text-sm leading-tight flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="truncate">{doc.name}</span>
                  </h4>

                  <p className="text-[11px] text-slate-400">
                    Subido: {formatDate(doc.uploadedAt)}
                  </p>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" /> Descargar
                  </a>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
