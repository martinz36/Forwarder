"use client";

import { useState, useTransition, useRef } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  CheckSquare,
  Globe,
  Lock,
  Link2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUploadThing } from "@/lib/uploadthing";
import { createDocumentAction, toggleDocumentDraftStatusAction, deleteDocumentAction } from "@/app/operations/documents-actions";
import { formatDate } from "@/lib/format";

export interface DocumentItem {
  id: string;
  name: string;
  fileUrl: string;
  documentType: "BL" | "FACTURA_COMERCIAL" | "PACKING_LIST" | "DAM" | "LIQUIDACION" | "OTRO";
  isPublic?: boolean;
  isDraft?: boolean;
  uploadedBy: string;
  uploadedAt: Date;
}

interface SmartDocumentsTabProps {
  operationId: string;
  sharedToken: string;
  documents: DocumentItem[];
}

const REQUIRED_SLOTS: Array<{
  type: "BL" | "FACTURA_COMERCIAL" | "PACKING_LIST" | "DAM" | "OTRO" | "LIQUIDACION";
  title: string;
  description: string;
  milestoneName: string;
}> = [
  {
    type: "BL",
    title: "1. Bill of Lading (HBL / BL / Guía Aérea)",
    description: "Documento de transporte principal emitido por naviera o agente de origen.",
    milestoneName: "Visto Bueno HBL / Liberación Origen",
  },
  {
    type: "FACTURA_COMERCIAL",
    title: "2. Factura Comercial & Packing List",
    description: "Documentación comercial del exportador necesaria para transmisión aduanera.",
    milestoneName: "Envío a Agencia de Aduanas",
  },
  {
    type: "DAM",
    title: "3. DAM / Declaración de Aduana & Volante",
    description: "Declaración Aduanera de Mercancías numerada ante SUNAT.",
    milestoneName: "Cancelación de Tributos (Ad Valorem / IGV)",
  },
  {
    type: "OTRO",
    title: "4. Volante & Guía de Transporte Local",
    description: "Autorización de retiro de depósito temporal y transporte de entrega en almacén.",
    milestoneName: "Carga Entregada en Destino",
  },
  {
    type: "LIQUIDACION",
    title: "5. Liquidación de Gastos Operativos",
    description: "Documento de cobranza final de servicios logísticos y reembolsos de despacho.",
    milestoneName: "Operación Liquidada",
  },
];

export function SmartDocumentsTab({
  operationId,
  sharedToken,
  documents,
}: SmartDocumentsTabProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Uploading state tracking per slot
  const [uploadingSlotType, setUploadingSlotType] = useState<string | null>(null);
  const uploadingSlotRef = useRef<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: async (res) => {
      const activeSlotType = uploadingSlotRef.current || uploadingSlotType;
      if (res && res[0] && activeSlotType) {
        const uploadedUrl = res[0].url;
        try {
          const slotInfo = REQUIRED_SLOTS.find((s) => s.type === activeSlotType);
          const docName = slotInfo ? slotInfo.title.replace(/^\d+\.\s*/, "") : "Documento Operativo";

          const result = await createDocumentAction({
            operationId,
            name: docName,
            fileUrl: uploadedUrl,
            documentType: activeSlotType as any,
            isPublic: true, // default public for client portal
            isDraft: true, // starts as Draft (Borrador)
            uploadedBy: "BROKER",
          });

          if (!result.success) {
            alert(result.error || "Error al registrar documento.");
          }
        } catch (err: any) {
          console.error(err);
          alert(typeof err?.message === "string" ? err.message : "Error al registrar documento.");
        } finally {
          uploadingSlotRef.current = null;
          setUploadingSlotType(null);
        }
      } else {
        uploadingSlotRef.current = null;
        setUploadingSlotType(null);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Error de subida: ${error.message}`);
      uploadingSlotRef.current = null;
      setUploadingSlotType(null);
    },
  });

  const sharedLink = typeof window !== "undefined"
    ? `${window.location.origin}/shared/${sharedToken}`
    : `/shared/${sharedToken}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(sharedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleFileUpload(slotType: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      uploadingSlotRef.current = slotType;
      setUploadingSlotType(slotType);
      startUpload([e.target.files[0]]);
      e.target.value = "";
    }
  }

  function handleToggleDraft(documentId: string, currentIsDraft: boolean) {
    startTransition(async () => {
      try {
        await toggleDocumentDraftStatusAction(documentId, operationId, !currentIsDraft);
      } catch (err: any) {
        alert(err?.message || "Error al actualizar estado del documento.");
      }
    });
  }

  function handleDelete(documentId: string) {
    if (!confirm("¿Deseas eliminar este documento del expediente?")) return;
    deleteDocumentAction(documentId, operationId);
  }

  // Count metrics
  const completedSlots = REQUIRED_SLOTS.filter((slot) =>
    documents.some((d) => d.documentType === slot.type)
  ).length;

  return (
    <div className="space-y-6">
      {/* Featured Client Shared Link Banner */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white shadow">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Portal Público del Importador (Seguimiento en Vivo)
              </h3>
              <p className="text-xs text-slate-600">
                Los archivos marcados como <strong>Finales / Públicos</strong> se actualizan automáticamente en el portal del cliente.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleCopyLink}
            className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 text-xs font-semibold h-8"
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-300" /> Enlace Copiado
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar Enlace Público
              </>
            )}
          </Button>
        </div>

        <div className="bg-white/80 p-2 rounded-md border text-xs font-mono text-slate-700 truncate">
          {sharedLink}
        </div>
      </div>

      {/* Smart Checklist Header */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-600" />
              <span>Smart Checklist: Documentos e Hitos Logísticos</span>
            </h2>
            <p className="text-xs text-slate-500">
              Al subir un documento en cada casilla, el hito logístico correspondiente se marcará como cumplido automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              {completedSlots} de {REQUIRED_SLOTS.length} Documentos Subidos
            </span>
            <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden border">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(completedSlots / REQUIRED_SLOTS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Requirements Grid / List */}
        <div className="space-y-3">
          {REQUIRED_SLOTS.map((slot) => {
            const doc = documents.find((d) => d.documentType === slot.type);
            const isSlotUploading = isUploading && uploadingSlotType === slot.type;

            return (
              <div
                key={slot.type}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  doc
                    ? doc.isDraft === false
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-amber-50/40 border-amber-200"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Left: Slot Description & Info */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{slot.title}</span>

                    {!doc ? (
                      <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-300">
                        PENDIENTE
                      </Badge>
                    ) : doc.isDraft !== false ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold gap-1">
                        <Clock className="h-3 w-3 text-amber-600" /> BORRADOR
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> FINAL
                      </Badge>
                    )}

                    <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      ⚡ Hito: {slot.milestoneName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">{slot.description}</p>

                  {/* Uploaded File Info details */}
                  {doc && (
                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900 truncate max-w-xs flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-blue-600" /> {doc.name}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 text-[11px]">{formatDate(doc.uploadedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Right: Actions (Upload / Replace / Finalize) */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {!doc ? (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(slot.type, e)}
                        disabled={isSlotUploading}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSlotUploading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3 gap-1 shadow-sm pointer-events-none"
                      >
                        {isSlotUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="h-3.5 w-3.5" />
                        )}
                        <span>Subir Archivo</span>
                      </Button>
                    </label>
                  ) : (
                    <>
                      {/* View & Download Links */}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-600" /> Ver
                      </a>

                      <a
                        href={doc.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-600" /> Descargar
                      </a>

                      {/* Replace File Button */}
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
                          onChange={(e) => handleFileUpload(slot.type, e)}
                          disabled={isSlotUploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSlotUploading}
                          className="text-xs h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold gap-1 pointer-events-none"
                          title="Reemplazar archivo actual con uno nuevo"
                        >
                          {isSlotUploading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          <span>Reemplazar</span>
                        </Button>
                      </label>

                      {/* Toggle Draft vs Final */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleToggleDraft(doc.id, doc.isDraft !== false)}
                        disabled={isPending}
                        className={`text-xs h-8 px-2.5 font-bold gap-1 ${
                          doc.isDraft !== false
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                        }`}
                      >
                        {isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : doc.isDraft !== false ? (
                          <>
                            <CheckSquare className="h-3.5 w-3.5" /> Marcar como Final
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5" /> Cambiar a Borrador
                          </>
                        )}
                      </Button>

                      {/* Delete */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Eliminar del expediente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
