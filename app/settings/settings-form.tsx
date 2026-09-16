"use client";

import { useState, useTransition } from "react";
import { Building2, Phone, MapPin, Globe, Mail, Save, Loader2, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyProfileData } from "@/lib/company";
import { updateCompanyProfileAction } from "./actions";

interface SettingsFormProps {
  initialProfile: CompanyProfileData;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const [profile, setProfile] = useState<CompanyProfileData>(initialProfile);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange(field: keyof CompanyProfileData, value: string) {
    if (field === "ruc") {
      // Clean non-numeric characters for RUC and limit to 11 digits
      value = value.replace(/\D/g, "").slice(0, 11);
    }
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await updateCompanyProfileAction(profile);
      if (res.success) {
        setSuccessMessage("Configuración de empresa actualizada exitosamente.");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.error || "Ocurrió un error al actualizar los datos.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-4 text-xs font-semibold text-red-800 border border-red-200">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Nombre Comercial */}
        <div className="space-y-1.5">
          <Label htmlFor="tradeName" className="text-xs font-bold text-slate-700">
            Nombre Comercial / Marca *
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="tradeName"
              value={profile.tradeName}
              onChange={(e) => handleChange("tradeName", e.target.value)}
              className="pl-9 font-semibold text-slate-900"
              placeholder="Ej: Marivan Logistics"
              required
            />
          </div>
        </div>

        {/* Razón Social */}
        <div className="space-y-1.5">
          <Label htmlFor="legalName" className="text-xs font-bold text-slate-700">
            Razón Social (Facturación) *
          </Label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="legalName"
              value={profile.legalName}
              onChange={(e) => handleChange("legalName", e.target.value)}
              className="pl-9 font-semibold text-slate-900"
              placeholder="Ej: Marivan Logistics SAC"
              required
            />
          </div>
        </div>

        {/* RUC */}
        <div className="space-y-1.5">
          <Label htmlFor="ruc" className="text-xs font-bold text-slate-700">
            RUC de la Empresa (11 dígitos)
          </Label>
          <Input
            id="ruc"
            value={profile.ruc}
            onChange={(e) => handleChange("ruc", e.target.value)}
            className="font-mono font-bold tracking-wider"
            placeholder="Ej: 20601234567"
            maxLength={11}
          />
          <p className="text-[11px] text-slate-400">Puedes confirmarlo o editarlo cuando gustes.</p>
        </div>

        {/* Teléfono */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
            Teléfono de Contacto *
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="pl-9 font-semibold text-slate-900"
              placeholder="Ej: 969 3010 95"
              required
            />
          </div>
        </div>

        {/* Dirección Fiscal (Ocupa 2 columnas) */}
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="address" className="text-xs font-bold text-slate-700">
            Dirección Fiscal / Oficina *
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="pl-9 font-semibold text-slate-900"
              placeholder="Ej: Calle Españoletto 115, departamento 101, San Borja"
              required
            />
          </div>
        </div>

        {/* Correo Electrónico */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-slate-700">
            Correo de Operaciones
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="pl-9 text-slate-900"
              placeholder="Ej: operaciones@marivanlogistics.com"
            />
          </div>
        </div>

        {/* Sitio Web */}
        <div className="space-y-1.5">
          <Label htmlFor="website" className="text-xs font-bold text-slate-700">
            Sitio Web
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              id="website"
              value={profile.website}
              onChange={(e) => handleChange("website", e.target.value)}
              className="pl-9 text-slate-900"
              placeholder="Ej: www.marivanlogistics.com"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end">
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow px-6"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
