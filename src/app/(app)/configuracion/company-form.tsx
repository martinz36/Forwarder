"use client";

import { useActionState } from "react";
import { updateOrganizationAction } from "./actions";
import { Field, FormError, FormSection, SubmitButton, TextArea } from "@/components/form";

export interface CompanyDefaults {
  legalName: string;
  name: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  quoteValidityDays: number;
  defaultMarkupPct: string;
  quoteTerms: string | null;
  paymentInstructions: string | null;
}

export function CompanyForm({ d }: { d: CompanyDefaults }) {
  const [state, action] = useActionState(updateOrganizationAction, undefined);
  return (
    <form action={action} className="space-y-8">
      <FormSection title="Empresa" description="Aparece en el encabezado de cotizaciones, avisos de llegada y liquidaciones.">
        <Field label="Razón social" name="legalName" defaultValue={d.legalName} required />
        <Field label="Nombre comercial" name="name" defaultValue={d.name} required />
        <Field label="RUC" name="taxId" defaultValue={d.taxId} inputMode="numeric" mono hint={d.taxId ? undefined : "Falta registrarlo: se necesita para los PDF y la facturación."} />
        <div className="sm:col-span-2">
          <Field label="Dirección" name="address" defaultValue={d.address} />
        </div>
        <Field label="Teléfono" name="phone" defaultValue={d.phone} type="tel" />
        <Field label="Correo" name="email" defaultValue={d.email} type="email" />
        <Field label="Web" name="website" defaultValue={d.website} />
      </FormSection>

      <FormSection title="Cotizaciones">
        <Field label="Validez (días)" name="quoteValidityDays" type="number" step="1" defaultValue={d.quoteValidityDays} hint="La fecha de vencimiento se pone sola al crear la cotización." />
        <Field label="Margen sugerido (%)" name="defaultMarkupPct" type="number" step="0.01" defaultValue={d.defaultMarkupPct} hint="Se usa en «Aplicar margen» sobre el costo del agente." />
        <div className="sm:col-span-2 lg:col-span-3">
          <TextArea label="Condiciones generales" name="quoteTerms" defaultValue={d.quoteTerms} rows={14} hint="Las líneas en MAYÚSCULAS sin viñeta salen como títulos en el PDF." />
        </div>
      </FormSection>

      <FormSection title="Cobranza">
        <div className="sm:col-span-2 lg:col-span-3">
          <TextArea
            label="Cuentas para depósito"
            name="paymentInstructions"
            defaultValue={d.paymentInstructions}
            rows={5}
            placeholder={"BCP Dólares: 191-XXXXXXX-1-XX · CCI 002-191-XXXXXXXXXXXX\nBCP Soles: 191-XXXXXXX-0-XX · CCI 002-191-XXXXXXXXXXXX\nTitular: …"}
            hint="Se imprimen en el aviso de llegada y en las liquidaciones con saldo."
          />
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-end">
        {state?.ok && <p className="text-sm text-ok">{state.ok}</p>}
        <FormError message={state?.error} />
        <SubmitButton pendingLabel="Guardando…" full={false}>
          Guardar configuración
        </SubmitButton>
      </div>
    </form>
  );
}
