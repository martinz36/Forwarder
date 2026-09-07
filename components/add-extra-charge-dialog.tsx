"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { addExtraChargeAction } from "@/app/operations/actions";

interface AddExtraChargeDialogProps {
  operationId: string;
}

export function AddExtraChargeDialog({ operationId }: AddExtraChargeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const description = formData.get("description") as string;
    const currency = formData.get("currency") as "USD" | "PEN";
    const unitCost = Number(formData.get("unitCost")) || 0;
    const unitPrice = Number(formData.get("unitPrice")) || 0;
    const quantity = Number(formData.get("quantity")) || 1;

    startTransition(async () => {
      try {
        await addExtraChargeAction(operationId, {
          description,
          currency,
          unitCost,
          unitPrice,
          quantity,
        });
        setOpen(false);
      } catch (err: any) {
        setError(err.message || "Error al agregar el sobrecosto.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white">
          <Plus className="mr-1.5 h-4 w-4" /> Registrar Sobrecosto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" /> Registrar Sobrecosto Operativo
          </DialogTitle>
          <DialogDescription>
            Agrega gastos no cotizados originalmente (Canal Rojo, Aforo Físico, Almacenaje Extra, Demoras de Contenedor).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description">Concepto / Descripción del Sobrecosto *</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ej: Aforo Físico Canal Rojo, Almacenaje Extra APM..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                name="currency"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
              >
                <option value="USD">USD ($)</option>
                <option value="PEN">PEN (S/)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="unitCost">Costo Unit. (Lo que se paga) *</Label>
              <Input
                id="unitCost"
                name="unitCost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unitPrice">Precio Venta Unit. (Cobro cliente) *</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Sobrecosto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
