"use client";

import { useState } from "react";
import { FileText, Download, Eye, Trash2, ShieldCheck, UserCheck, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteDocumentAction } from "@/app/operations/documents-actions";
import { formatDate } from "@/lib/format";

interface ClientDocument {
  id: string;
  operationId: string;
  name: string;
  fileUrl: string;
  documentType: string;
  uploadedBy: string;
  uploadedAt: Date;
  operationCode: string;
  blNumber?: string | null;
}

interface ClientDocumentsRepositoryProps {
  documents: ClientDocument[];
}

export function ClientDocumentsRepository({ documents }: ClientDocumentsRepositoryProps) {
  function handleDelete(docId: string, opId: string) {
    if (!confirm("¿Deseas eliminar este documento del expediente del cliente?")) return;
    deleteDocumentAction(docId, opId);
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Expediente Documentario Consolidado</h3>
        </div>
        <span className="text-xs font-normal text-slate-500">{documents.length} archivos registrados</span>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-lg border border-dashed">
          No hay comprobantes o documentos emitidos para este cliente aún.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border bg-slate-50/50 hover:bg-slate-50 p-4 shadow-sm space-y-3 flex flex-col justify-between transition-colors"
            >
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

                <h4 className="font-bold text-slate-900 text-sm leading-tight flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="truncate">{doc.name}</span>
                </h4>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>
                    Expediente: <span className="font-bold text-slate-700">{doc.operationCode}</span>
                    {doc.blNumber ? ` • BL: ${doc.blNumber}` : ""}
                  </p>
                  <p className="text-slate-400">Fecha: {formatDate(doc.uploadedAt)}</p>
                </div>
              </div>

              <div className="pt-2 border-t flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    title="Ver Online"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver Online
                  </a>

                  <a
                    href={doc.fileUrl}
                    download={doc.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:underline"
                    title="Descargar Archivo"
                  >
                    <Download className="h-3.5 w-3.5" /> Descargar
                  </a>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.operationId)}
                  title="Borrar documento del cliente"
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
  );
}
