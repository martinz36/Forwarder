import { Building2, Phone, MapPin, Globe, Mail, ShieldCheck } from "lucide-react";
import { getCompanyProfile } from "@/lib/company";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCompanyProfile();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuración de Empresa</h1>
            <p className="text-xs text-slate-400 mt-1">
              Administra la información corporativa, razón social de facturación y datos de contacto de Marivan Logistics.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> Datos Institucionales & Facturación
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estos datos aparecerán reflejados en los documentos impresos, Cotizaciones PDF, Planillas de Cobro y Avisos de Arribo.
          </p>
        </div>

        <SettingsForm initialProfile={profile} />
      </div>
    </div>
  );
}
