"use client";

import { useState, useEffect } from "react";
import { FolderPlus, Loader2, Ship, Package, Plane, Truck, UserPlus, X, Check } from "lucide-react";
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
import { createExpedientAction } from "@/app/expedients/actions";
import { createClientAction } from "@/app/clients/actions";

interface ClientOption {
  id: string;
  businessName: string;
  documentNumber: string;
}

interface CreateExpedientDialogProps {
  clients: ClientOption[];
}

export function CreateExpedientDialog({ clients: initialClients }: CreateExpedientDialogProps) {
  const [open, setOpen] = useState(false);
  const [clientList, setClientList] = useState<ClientOption[]>(initialClients);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loadType, setLoadType] = useState<"FCL" | "LCL" | "AÉREO" | "TERRESTRE">("FCL");
  const [customCode, setCustomCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline Client Creation state
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newDocumentType, setNewDocumentType] = useState<"RUC" | "DNI" | "CE">("RUC");
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [clientLoading, setClientLoading] = useState(false);
  const [inlineClientError, setInlineClientError] = useState<string | null>(null);

  useEffect(() => {
    setClientList(initialClients);
  }, [initialClients]);

  const selectedClient = clientList.find((c) => c.id === selectedClientId);

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

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newBusinessName.trim()) {
      setInlineClientError("Ingresa la razón social o nombre.");
      return;
    }
    if (!newDocumentNumber.trim()) {
      setInlineClientError("Ingresa el número de documento.");
      return;
    }

    try {
      setClientLoading(true);
      setInlineClientError(null);
      const res = await createClientAction({
        businessName: newBusinessName,
        documentType: newDocumentType,
        documentNumber: newDocumentNumber,
        email: newEmail,
        phone: newPhone,
      });

      if (!res.success || !res.client) {
        setInlineClientError(res.error || "Error al crear el cliente.");
        return;
      }

      const newClient = res.client;
      setClientList((prev) => [newClient, ...prev]);
      setSelectedClientId(newClient.id);
      setIsCreatingClient(false);
      setNewBusinessName("");
      setNewDocumentNumber("");
      setNewEmail("");
      setNewPhone("");
    } catch (err: any) {
      console.error(err);
      const msg = typeof err?.message === "string" ? err.message : "Error inesperado al crear el cliente.";
      setInlineClientError(msg);
    } finally {
      setClientLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError("Por favor selecciona un cliente.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const transportMode = loadType === "AÉREO" ? "AIR" : loadType === "LCL" ? "LCL" : "FCL";
      await createExpedientAction({
        clientId: selectedClientId,
        loadType,
        transportMode,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Client Selection & Inline Creation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="client-select" className="text-sm font-semibold text-slate-700">
                1. Cliente Importador *
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreatingClient(!isCreatingClient);
                  setInlineClientError(null);
                }}
                className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 gap-1 font-medium"
              >
                {isCreatingClient ? (
                  <>
                    <X className="h-3.5 w-3.5" />
                    <span>Cancelar</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>+ Crear Nuevo Cliente</span>
                  </>
                )}
              </Button>
            </div>

            {isCreatingClient ? (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                    Nuevo Cliente Express
                  </span>
                </div>

                {inlineClientError && (
                  <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-medium">
                    {String(inlineClientError)}
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Razón Social / Nombre *
                  </Label>
                  <Input
                    placeholder="Ej. Nave Espacial S.A.C."
                    value={newBusinessName}
                    onChange={(e) => setNewBusinessName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Tipo Doc *</Label>
                    <select
                      value={newDocumentType}
                      onChange={(e: any) => setNewDocumentType(e.target.value as "RUC" | "DNI" | "CE")}
                      className="w-full h-8 rounded-md border border-slate-300 bg-white px-2 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="RUC">RUC</option>
                      <option value="DNI">DNI</option>
                      <option value="CE">CE</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">N° Documento *</Label>
                    <Input
                      placeholder="20123456789"
                      value={newDocumentNumber}
                      onChange={(e) => setNewDocumentNumber(e.target.value)}
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Email (Opcional)</Label>
                    <Input
                      type="email"
                      placeholder="contacto@empresa.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-700">Teléfono (Opcional)</Label>
                    <Input
                      placeholder="+51 987654321"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingClient(false)}
                    className="h-7 text-xs text-slate-600"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateClient}
                    disabled={clientLoading}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1"
                  >
                    {clientLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>Guardar y Seleccionar</span>
                  </Button>
                </div>
              </div>
            ) : (
              <select
                id="client-select"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Selecciona un Cliente --</option>
                {clientList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.documentNumber})
                  </option>
                ))}
              </select>
            )}
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
          {(() => {
            const prefix = loadType === "AÉREO" ? "A" : loadType === "LCL" ? "L" : loadType === "TERRESTRE" ? "T" : "M";
            const extCodePreview = `${prefix}-2026-0001`;
            return (
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Referencia Externa (Correos / Clientes):
                  </span>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                    Modo: {prefix === "A" ? "Aéreo (A)" : prefix === "L" ? "LCL (L)" : "FCL (M)"}
                  </span>
                </div>
                <div className="font-mono font-black text-emerald-400 text-lg flex items-center justify-between">
                  <span>{extCodePreview}</span>
                  <span className="text-xs text-slate-400 font-normal">Código Corto Oficial</span>
                </div>
                <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 font-mono">
                  Interno: {codePreview}
                </div>
              </div>
            );
          })()}

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
