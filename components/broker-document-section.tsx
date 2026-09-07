"use client";

import { useState, useTransition } from "react";
import { Link2, Copy, Check, FileText, Download, Trash2, UploadCloud, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

  // Manual or UploadThing File State
  const [docName, setDocName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [docType, setDocType] = useState<"BL" | "FACTURA_COMERCIAL" | "PACKING_LIST" | "DAM" | "LIQUIDACION" | "OTRO">("BL");

  const sharedLink = typeof window !== "undefined"
    ? `${window.location.origin}/shared/${sharedToken}`
    : `/shared/${sharedToken}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(sharedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();
    if (!docName || !fileUrl) {
      alert("Ingresa el nombre del documento y la URL del archivo.");
      return;
    }

    startTransition(async () => {
      try {
        await createDocumentAction({
          operationId,
          name: docName,
          fileUrl,
          documentType: docType,
          uploadedBy: "BROKER",
        });
        setDocName("");
        setFileUrl("");
      } catch (err: any) {
        alert(err.message || "Error al subir documento.");
      }
    });
  }

  function handleDelete(documentId: string) {
    if (!confirm("¿Deseas eliminar este documento del expediente?")) return;
    startTransition(async () => {
      await deleteDocumentAction(documentId, operationId);
    });
  }

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

      {/* Broker Upload Form */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b pb-3">
          <UploadCloud className="h-5 w-5 text-blue-600" /> Subir Documento al Expediente (Broker)
        </h3>

        <form onSubmit={handleAddDocument} className="grid gap-4 sm:grid-cols-12 items-end">
          <div className="sm:col-span-4 space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Nombre del Documento *</Label>
            <Input
              placeholder="Ej: Bill of Lading (BL) Final, DAM Definitiva..."
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-3 space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Tipo de Documento</Label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="BL">BL (Bill of Lading)</option>
              <option value="DAM">DAM / DUA Aduanera</option>
              <option value="LIQUIDACION">Liquidación de Tributos</option>
              <option value="FACTURA_COMERCIAL">Factura Comercial</option>
              <option value="PACKING_LIST">Packing List</option>
              <option value="OTRO">Otro Documento</option>
            </select>
          </div>

          <div className="sm:col-span-3 space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">URL del Archivo *</Label>
            <Input
              placeholder="https://... o enlace de archivo"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs h-9"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Archivo"}
            </Button>
          </div>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
          <span>Expediente Documentario Integrado</span>
          <span className="text-xs font-normal text-slate-500">{documents.length} archivos registrados</span>
        </h3>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-slate-50 p-8 text-center text-sm text-slate-500">
            No se han subido documentos aún. Usa el formulario de arriba para cargar el BL, DAM o Liquidaciones.
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
