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
  Link2,
  Copy,
  Check,
  Loader2,
  FileCheck2,
  PlusCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUploadThing } from "@/lib/uploadthing";
import {
  createDocumentAction,
  toggleDocumentDraftStatusAction,
  deleteDocumentAction,
} from "@/app/operations/documents-actions";
import {
  deleteChecklistItemAction,
  toggleChecklistItemCompleteAction,
} from "@/app/operations/checklist-actions";
import { AddSpecialRequirementDialog } from "@/components/add-special-requirement-dialog";
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

export interface ChecklistItemType {
  id: string;
  operationId: string;
  title: string;
  description?: string | null;
  documentType: string;
  isCompleted: boolean;
  isRequired: boolean;
  order: number;
}

interface SmartDocumentsTabProps {
  operationId: string;
  sharedToken: string;
  documents: DocumentItem[];
  checklistItems: ChecklistItemType[];
}

export function SmartDocumentsTab({
  operationId,
  sharedToken,
  documents,
  checklistItems,
}: SmartDocumentsTabProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Uploading state tracking per checklist item ID
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const uploadingItemRef = useRef<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("documentUploader", {
    onClientUploadComplete: async (res) => {
      const activeItemId = uploadingItemRef.current || uploadingItemId;
      if (res && res[0] && activeItemId) {
        const uploadedUrl = res[0].url;
        try {
          const itemInfo = checklistItems.find((ci) => ci.id === activeItemId);
          const docName = itemInfo ? itemInfo.title.replace(/^\d+\.\s*/, "") : "Documento Operativo";
          const docType = itemInfo?.documentType || "OTRO";

          const result = await createDocumentAction({
            operationId,
            name: docName,
            fileUrl: uploadedUrl,
            documentType: docType as any,
            uploadedBy: "BROKER",
            isPublic: true,
            isDraft: true,
            checklistItemId: activeItemId,
          });

          if (!result.success) {
            alert(result.error || "Error al registrar documento.");
          }
        } catch (err: any) {
          console.error(err);
          alert(typeof err?.message === "string" ? err.message : "Error al registrar documento.");
        } finally {
          uploadingItemRef.current = null;
          setUploadingItemId(null);
        }
      } else {
        uploadingItemRef.current = null;
        setUploadingItemId(null);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Error de subida: ${error.message}`);
      uploadingItemRef.current = null;
      setUploadingItemId(null);
    },
  });

  const sharedLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/shared/${sharedToken}`
      : `/shared/${sharedToken}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(sharedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function handleFileUpload(itemId: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      uploadingItemRef.current = itemId;
      setUploadingItemId(itemId);
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

  function handleDeleteDocument(documentId: string) {
    if (!confirm("¿Deseas eliminar este archivo cargado del expediente?")) return;
    deleteDocumentAction(documentId, operationId);
  }

  function handleDeleteChecklistItem(itemId: string) {
    if (!confirm("¿Deseas eliminar este requisito del checklist de esta operación?")) return;
    startTransition(async () => {
      try {
        await deleteChecklistItemAction(itemId, operationId);
      } catch (err: any) {
        alert(err?.message || "Error al eliminar requisito.");
      }
    });
  }

  // Count metrics dynamically
  const totalItemsCount = checklistItems.length;
  const completedItemsCount = checklistItems.filter((item) => item.isCompleted).length;
  const progressPercent = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

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
                Los archivos marcados como <strong>Finales / Públicos</strong> se muestran en tiempo real en el portal del cliente.
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-600" />
              <span>Smart Checklist: Requisitos y Documentos Operativos</span>
            </h2>
            <p className="text-xs text-slate-500">
              Personaliza los documentos requeridos para este despacho. Sube archivos o elimina ítems que no apliquen.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-800">
                {completedItemsCount} de {totalItemsCount} Requisitos Cumplidos
              </div>
              <div className="text-[10px] text-slate-500 font-medium">Progreso del Expediente: {progressPercent}%</div>
            </div>
            <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden border shrink-0">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Add Special Requirement Button */}
            <AddSpecialRequirementDialog operationId={operationId} />
          </div>
        </div>

        {/* Requirements Grid / List */}
        <div className="space-y-3">
          {checklistItems.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-xs text-slate-500 space-y-2">
              <p>No hay requisitos definidos para esta operación.</p>
            </div>
          ) : (
            checklistItems.map((item) => {
              // Find uploaded document matching this item's documentType or title
              const doc = documents.find((d) => d.documentType === item.documentType);
              const isItemUploading = isUploading && uploadingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    doc
                      ? doc.isDraft === false
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-amber-50/40 border-amber-200"
                      : item.isCompleted
                      ? "bg-emerald-50/30 border-emerald-200"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Left: Item Description & Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{item.title}</span>

                      {!doc && !item.isCompleted ? (
                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-300">
                          PENDIENTE
                        </Badge>
                      ) : doc && doc.isDraft !== false ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold gap-1">
                          <Clock className="h-3 w-3 text-amber-600" /> BORRADOR
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> CUMPLIDO / FINAL
                        </Badge>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500">{item.description}</p>
                    )}

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

                  {/* Right: Actions (Upload / Replace / Finalize / Delete Requirement) */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {!doc ? (
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
                            onChange={(e) => handleFileUpload(item.id, e)}
                            disabled={isItemUploading}
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={isItemUploading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3 gap-1 shadow-sm pointer-events-none"
                          >
                            {isItemUploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="h-3.5 w-3.5" />
                            )}
                            <span>Subir Archivo</span>
                          </Button>
                        </label>

                        {/* Delete pending checklist item icon button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          disabled={isPending}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar este requisito de la lista"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
                            onChange={(e) => handleFileUpload(item.id, e)}
                            disabled={isItemUploading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isItemUploading}
                            className="text-xs h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50 font-semibold gap-1 pointer-events-none"
                            title="Reemplazar archivo actual con uno nuevo"
                          >
                            {isItemUploading ? (
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

                        {/* Delete file */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar archivo del expediente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
