"use client";

import { useState } from "react";
import { FolderPlus, Loader2, Ship, Package, Plane, Truck } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [loadType, setLoadType] = useState<"FCL" | "LCL" | "AÉREO" | "TERRESTRE">("FCL");
  const [customCode, setCustomCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Generate live code preview
  let codePreview = "EXP-2026-CLIENTE-FCL-0001";
  if (customCode.trim()) {
    codePreview = customCode.trim();
  } else if (selectedClient) {
    const cleanName = selectedClient.businessName
      .toUpperCase()
      .replace(/\b(S\.?A\.?C\.?|S\.?A\.?|E\.?I\.?R\.?L\.?|S\.?R\.?L\.?|INC|LLC|CORP|PERU|PERÚ)\b/gi, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9\s]/g, "")
      .trim();
    const words = cleanName.split(/\s+/).filter(Boolean);
    const slug = (words.slice(0, 2).join("-") || "CLIENTE").slice(0, 18);
    const year = new Date().getFullYear();
    codePreview = `EXP-${year}-${slug}-${loadType}-0001`;
  }

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
        loadType,
        customCode,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <FolderPlus className="h-5 w-5 text-blue-600" />
            <span>Abrir Nuevo Expediente (Routing Order)</span>
          </DialogTitle>
          <DialogDescription>
            Crea un expediente personalizado con el nombre del cliente y la modalidad de carga (FCL / LCL).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="client-select" className="text-sm font-semibold text-slate-700">
              1. Cliente Importador *
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

          {/* Load Type Selector (FCL / LCL / AÉREO / TERRESTRE) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700">
              2. Modalidad / Tipo de Carga *
            </Label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setLoadType("FCL")}
                className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                  loadType === "FCL"
                    ? "bg-blue-50 border-blue-600 text-blue-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Ship className="h-4 w-4" />
                <span>FCL (Contenedor)</span>
              </button>

              <button
                type="button"
                onClick={() => setLoadType("LCL")}
                className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                  loadType === "LCL"
                    ? "bg-purple-50 border-purple-600 text-purple-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Package className="h-4 w-4" />
                <span>LCL (Consolidado)</span>
              </button>

              <button
                type="button"
                onClick={() => setLoadType("AÉREO")}
                className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                  loadType === "AÉREO"
                    ? "bg-sky-50 border-sky-600 text-sky-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Plane className="h-4 w-4" />
                <span>AÉREO</span>
              </button>

              <button
                type="button"
                onClick={() => setLoadType("TERRESTRE")}
                className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                  loadType === "TERRESTRE"
                    ? "bg-amber-50 border-amber-600 text-amber-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Truck className="h-4 w-4" />
                <span>TERRESTRE</span>
              </button>
            </div>
          </div>

          {/* Live Code Preview Banner */}
          <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Vista Previa del Código de Expediente:
            </span>
            <div className="font-mono font-bold text-emerald-400 text-base">
              {codePreview}
            </div>
          </div>

          {/* Custom Code Overwrite Option */}
          <div className="space-y-1.5">
            <Label htmlFor="custom-code" className="text-xs font-medium text-slate-600">
              Código Personalizado (Opcional - Reemplaza la vista previa automática)
            </Label>
            <Input
              id="custom-code"
              placeholder="Ej. EXPEDIENTE NAVE ESPACIAL FCL 2026"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="text-sm font-mono"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="exp-notes" className="text-xs font-medium text-slate-600">
              Observaciones / Referencia Operativa (Opcional)
            </Label>
            <textarea
              id="exp-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Carga de prueba, proveedor Yiwu..."
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
