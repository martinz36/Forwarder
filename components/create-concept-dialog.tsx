"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Tags, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { createConceptAction, updateConceptAction } from "@/app/catalog/actions";

interface ConceptData {
  id: string;
  name: string;
  defaultCurrency: string;
  defaultPrice: number | null;
  isTaxable?: boolean;
}

interface CreateConceptDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  conceptToEdit?: (Partial<ConceptData> & { id?: string }) | null;
  onSuccess?: (created: ConceptData) => void;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "lg" | "icon";
  triggerClassName?: string;
  showTrigger?: boolean;
}

export function CreateConceptDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  conceptToEdit,
  onSuccess,
  triggerText,
  triggerVariant = "default",
  triggerSize = "sm",
  triggerClassName,
  showTrigger = true,
}: CreateConceptDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(conceptToEdit?.name || "");
  const [defaultCurrency, setDefaultCurrency] = useState<"USD" | "PEN">(
    (conceptToEdit?.defaultCurrency as "USD" | "PEN") || "USD"
  );
  const [defaultPrice, setDefaultPrice] = useState<string>(
    conceptToEdit?.defaultPrice !== undefined && conceptToEdit?.defaultPrice !== null
      ? String(conceptToEdit.defaultPrice)
      : "100"
  );
  const [isTaxable, setIsTaxable] = useState<boolean>(
    conceptToEdit?.isTaxable !== false
  );

  const isEditing = !!conceptToEdit;

  function handleSubmit(e?: React.FormEvent | React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError(null);

    if (!name.trim()) {
      setError("El nombre del concepto es obligatorio.");
      return;
    }

    startTransition(async () => {
      try {
        const priceNum = parseFloat(defaultPrice) || 0;
        let result: any;
        if (isEditing && conceptToEdit?.id) {
          result = await updateConceptAction(conceptToEdit.id, {
            name: name.trim(),
            defaultCurrency,
            defaultPrice: priceNum,
            isTaxable,
          });
        } else {
          result = await createConceptAction({
            name: name.trim(),
            defaultCurrency,
            defaultPrice: priceNum,
            isTaxable,
          });
        }

        setOpen(false);
        if (!isEditing) {
          setName("");
          setDefaultPrice("100");
        }
        if (onSuccess && result) {
          onSuccess(result);
        }
      } catch (err: any) {
        setError(err.message || "Error al guardar el concepto.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          {isEditing ? (
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs font-semibold text-blue-600 border-blue-200">
              <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
            </Button>
          ) : (
            <Button
              variant={triggerVariant}
              size={triggerSize}
              className={triggerClassName || "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"}
            >
              <Plus className="h-4 w-4" /> {triggerText || "Nuevo Concepto"}
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        className="sm:max-w-md bg-white"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar Concepto en Catálogo" : "Crear Nuevo Concepto en Catálogo"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Define las características predeterminadas (precio, moneda y afectación IGV) para este servicio.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="space-y-4 pt-2"
        >
          {error && (
            <div className="p-3 text-xs rounded-md bg-red-50 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="concept-name" className="text-xs font-semibold text-slate-700">
              Nombre del Concepto / Servicio *
            </Label>
            <Input
              id="concept-name"
              placeholder="Ej: Flete Marítimo FCL, Handling, Visto Bueno..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="concept-currency" className="text-xs font-semibold text-slate-700">
                Moneda Base
              </Label>
              <select
                id="concept-currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as "USD" | "PEN")}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs shadow-sm font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="USD">USD ($)</option>
                <option value="PEN">PEN (S/)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="concept-price" className="text-xs font-semibold text-slate-700">
                Precio Predeterminado ($/S/)
              </Label>
              <Input
                id="concept-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                className="h-9 text-xs font-bold text-blue-900 text-right"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-slate-700 block">Afectación Tributaria (SUNAT)</Label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="taxable"
                  checked={isTaxable}
                  onChange={() => setIsTaxable(true)}
                  className="h-4 w-4 text-blue-600"
                />
                Afecto a IGV (18% Ley Peruana)
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-slate-800">
                <input
                  type="radio"
                  name="taxable"
                  checked={!isTaxable}
                  onChange={() => setIsTaxable(false)}
                  className="h-4 w-4 text-amber-600"
                />
                Inafecto / Reembolso por Terceros
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={(e) => handleSubmit(e)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Concepto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
