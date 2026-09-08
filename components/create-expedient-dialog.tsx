"use client";

import { useState } from "react";
import { FolderPlus, Loader2, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createExpedientAction } from "@/app/expedients/actions";

interface ClientOption {
  id: string;
  businessName: string;
  documentNumber: string;
}

interface CreateExpedientDialogProps {
  clients: ClientOption[];
}

export function CreateExpedientDialog({ clients }: CreateExpedientDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError("Por favor selecciona un cliente.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createExpedientAction({
        clientId: selectedClientId,
        notes,
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al crear el expediente.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow gap-2">
          <FolderPlus className="h-4 w-4" />
          <span>Abrir Nuevo Expediente</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            <span>Abrir Nuevo Expediente (Routing Order)</span>
          </DialogTitle>
          <DialogDescription>
            Inicia un nuevo expediente logístico especificando el cliente. Se asignará automáticamente un código secuencial (EXP-2026-XXXX).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="client-select" className="text-sm font-semibold text-slate-700">
              Cliente Importador *
            </Label>
            <select
              id="client-select"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Selecciona un Cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.documentNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-notes" className="text-sm font-medium text-slate-700">
              Observaciones / Referencia Interna (Opcional)
            </Label>
            <textarea
              id="exp-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Carga de prueba, proveedor Yiwu, despacho prioritario..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Generar Expediente"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
