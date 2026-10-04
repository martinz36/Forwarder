"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, Loader2, Calendar, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { addClientNoteAction } from "@/app/clients/actions";

interface NoteItem {
  id: string;
  content: string;
  createdBy?: string | null;
  createdAt: Date | string;
}

interface ClientNotesSectionProps {
  clientId: string;
  notes: NoteItem[];
}

export function ClientNotesSection({ clientId, notes }: ClientNotesSectionProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        await addClientNoteAction(clientId, content);
        setContent("");
      } catch (err: any) {
        setError(err.message || "Error al agregar nota.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* New Note Form */}
      <form onSubmit={handleAddNote} className="rounded-xl border bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <span>Bitácora & Notas Internas CRM</span>
        </div>
        <p className="text-xs text-slate-500">
          Registra acuerdos comerciales, observaciones de pago, preferencias del cliente o alertas de despacho.
        </p>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe una observación o nota comercial aquí..."
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending || !content.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Agregar Nota
              </>
            )}
          </Button>
        </div>
      </form>

      {/* History of Notes */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-900 text-sm">Historial de Comentarios ({notes.length})</h4>

        {notes.length === 0 ? (
          <div className="rounded-xl border bg-slate-50 p-6 text-center text-xs text-slate-400 italic">
            No hay notas registradas para este cliente aún.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b pb-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <span>{note.createdBy || "BROKER"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-medium">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
