"use client";

import { useState, useTransition } from "react";
import { PlusCircle, Loader2, FilePlus2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addChecklistItemAction } from "@/app/operations/checklist-actions";

interface AddSpecialRequirementDialogProps {
  operationId: string;
}

const PRESETS = [
  {
    title: "Permiso DIGESA / Registro Sanitario",
    description: "Autorización o Registro Sanitario de importación para alimentos, bebidas o cosméticos.",
    documentType: "OTRO",
  },
  {
    title: "Permiso SENASA / Fitosanitario",
    description: "Certificado o permiso de internamiento agropecuario y de productos vegetales.",
    documentType: "OTRO",
  },
  {
    title: "Certificado de Origen",
    description: "Documento para acogerse a preferencia arancelaria bajo Tratado de Libre Comercio (TLC).",
    documentType: "OTRO",
  },
  {
    title: "Trámite VUCE / Permiso MTC",
    description: "Permiso de internamiento de equipos de telecomunicaciones o mercancía restringida.",
    documentType: "OTRO",
  },
  {
    title: "Póliza de Seguro de Transportes",
    description: "Certificado de cobertura de seguro de carga internacional.",
    documentType: "OTRO",
  },
];

export function AddSpecialRequirementDialog({ operationId }: AddSpecialRequirementDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSelectPreset(index: number) {
    setSelectedPresetIndex(index);
    const preset = PRESETS[index];
    setTitle(preset.title);
    setDescription(preset.description);
  }

  function handleCustomSelect() {
    setSelectedPresetIndex(null);
    setTitle("");
    setDescription("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("El título del requisito es obligatorio.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const docType = selectedPresetIndex !== null ? PRESETS[selectedPresetIndex].documentType : "OTRO";
        const result = await addChecklistItemAction({
          operationId,
          title: title.trim(),
          description: description.trim() || undefined,
          documentType: docType,
        });

        if (result.success) {
          setTitle("");
          setDescription("");
          setSelectedPresetIndex(null);
          setOpen(false);
        } else {
          setErrorMsg(result.error || "Error al añadir el requisito especial.");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Error al añadir el requisito.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 font-bold text-xs h-8 gap-1.5 shadow-sm"
        >
          <PlusCircle className="h-4 w-4 text-blue-600" />
          <span>+ Añadir Requisito Especial</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span>Añadir Requisito o Documento Especial</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Agrega permisos requeridos o documentación específica para este despacho aduanero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-2.5 text-xs rounded-md bg-red-50 text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Quick Presets Grid */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Requisitos Frecuentes (Plantillas):</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {PRESETS.map((preset, idx) => {
                const isSelected = selectedPresetIndex === idx;
                return (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handleSelectPreset(idx)}
                    className={`p-2 rounded-lg text-left text-xs border transition-all flex items-start justify-between gap-1 ${
                      isSelected
                        ? "bg-blue-50 border-blue-400 font-semibold text-blue-900 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="truncate">{preset.title}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <Label htmlFor="req-title" className="text-xs font-semibold text-slate-700">
              Nombre / Título del Requisito <span className="text-red-500">*</span>
            </Label>
            <Input
              id="req-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (selectedPresetIndex !== null && e.target.value !== PRESETS[selectedPresetIndex].title) {
                  setSelectedPresetIndex(null);
                }
              }}
              placeholder="Ej: Permiso DIGESA Alimentos"
              className="text-xs h-9"
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <Label htmlFor="req-desc" className="text-xs font-semibold text-slate-700">
              Instrucciones u Observaciones (Opcional):
            </Label>
            <textarea
              id="req-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Adjuntar resolución sanitaria de DIGESA aprobada..."
              className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FilePlus2 className="h-3.5 w-3.5" />
              )}
              <span>Guardar Requisito</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
