"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, Building2, User, Mail, Phone, MapPin, CreditCard } from "lucide-react";
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
import { clientSchema, ClientFormValues } from "@/lib/validations/client";
import { createClientAction } from "@/app/clients/actions";

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      documentType: "RUC",
      documentNumber: "",
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const selectedDocType = watch("documentType");

  function onSubmit(values: ClientFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await createClientAction(values);
        reset();
        setOpen(false);
      } catch (err: any) {
        setServerError(err.message || "Error al registrar cliente.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-blue-600" /> Registrar Nuevo Cliente B2B
          </DialogTitle>
          <DialogDescription>
            Ingresa el documento fiscal y la razón social completa para operaciones de agenciamiento aduanero.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {serverError}
            </div>
          )}

          {/* 2-Column Responsive Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fila 1: Tipo de Documento + Número de Documento */}
            <div className="space-y-1.5">
              <Label htmlFor="documentType" className="text-xs font-semibold text-slate-700">
                Tipo de Doc. *
              </Label>
              <select
                id="documentType"
                {...register("documentType")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
              >
                <option value="RUC">RUC (Perú - 11 dígitos)</option>
                <option value="DNI">DNI (Persona Natural - 8 dígitos)</option>
                <option value="CE">Carnet de Extranjería (CE)</option>
              </select>
              {errors.documentType && (
                <p className="text-xs font-medium text-red-500">{errors.documentType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="documentNumber" className="text-xs font-semibold text-slate-700">
                N° de Documento *
              </Label>
              <div className="relative">
                <Input
                  id="documentNumber"
                  placeholder={selectedDocType === "RUC" ? "Ej: 20601234567" : "Ej: 71234567"}
                  maxLength={selectedDocType === "RUC" ? 11 : 12}
                  {...register("documentNumber")}
                  className="font-mono font-bold"
                />
              </div>
              {errors.documentNumber && (
                <p className="text-xs font-medium text-red-500">{errors.documentNumber.message}</p>
              )}
            </div>

            {/* Fila 2: Razón Social (Ocupa 2 Columnas) */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="businessName" className="text-xs font-semibold text-slate-700">
                Razón Social / Nombre Completo *
              </Label>
              <Input
                id="businessName"
                placeholder="Ej: IMPORTACIONES & LOGISTICA DEL PACIFICO S.A.C."
                {...register("businessName")}
              />
              {errors.businessName && (
                <p className="text-xs font-medium text-red-500">{errors.businessName.message}</p>
              )}
            </div>

            {/* Fila 3: Dirección Fiscal (Ocupa 2 Columnas) */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700">
                Dirección Fiscal Completa
              </Label>
              <Input
                id="address"
                placeholder="Ej: Av. Elmer Faucett 2050, Of. 402, Callao"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-xs font-medium text-red-500">{errors.address.message}</p>
              )}
            </div>

            {/* Fila 4: Nombre del Contacto + Teléfono */}
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs font-semibold text-slate-700">
                Persona de Contacto
              </Label>
              <Input
                id="contactName"
                placeholder="Ej: Juan Pérez (Gerente Logística)"
                {...register("contactName")}
              />
              {errors.contactName && (
                <p className="text-xs font-medium text-red-500">{errors.contactName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                Teléfono de Contacto
              </Label>
              <Input
                id="phone"
                placeholder="Ej: +51 987654321"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs font-medium text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Fila 5: Correo Electrónico (Ocupa 2 Columnas) */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: operaciones@empresa.pe"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
