"use client";

import { useActionState, useState } from "react";
import { createExpedienteAction } from "../actions";
import { ActionForm, Check, Field, FormError, FormSection, SelectField, SubmitButton, TextArea } from "@/components/form";
import { EQUIPMENT_OPTIONS, INCOTERMS, TAX_ID_OPTIONS } from "@/lib/catalog";

type Option = { value: string; label: string };

function Segmented({ name, options, value, onChange }: { name: string; options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" className="mt-1.5 inline-flex flex-wrap rounded-sm border border-rule bg-surface p-0.5">
      {options.map((o) => (
        <label
          key={o.value}
          className={`press cursor-pointer rounded-[4px] px-3 py-1.5 text-sm ${value === o.value ? "bg-navy text-white" : "text-ink-2 hover:text-ink"}`}
        >
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function PlaceField({ label, name, options, defaultValue }: { label: string; name: string; options: Option[]; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-ink">{label}</span>
        <select
          name={value === "__other" ? undefined : `${name}Id`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 block w-full rounded-sm border border-rule bg-surface px-3 py-2 text-ink hover:border-ink-3 focus:border-navy focus:outline-none"
        >
          <option value="">Sin definir</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="__other">Otro (escribir)…</option>
        </select>
      </label>
      {value === "__other" && (
        <input
          name={`${name}Text`}
          placeholder="Ciudad / puerto"
          className="mt-2 block w-full rounded-sm border border-rule bg-surface px-3 py-2 text-ink focus:border-navy focus:outline-none"
        />
      )}
    </div>
  );
}

export function NewExpedienteForm({
  clients,
  locations,
  defaultDestinationId,
}: {
  clients: Option[];
  locations: Option[];
  defaultDestinationId?: string;
}) {
  const [state, action, pending] = useActionState(createExpedienteAction, undefined);
  const [clientMode, setClientMode] = useState(clients.length ? "existing" : "new");
  const [direction, setDirection] = useState("IMPORT");
  const [mode, setMode] = useState("SEA_LCL");

  return (
    <ActionForm action={action} className="space-y-8">
      <FormSection title="Cliente">
        <div className="sm:col-span-2 lg:col-span-3">
          <Segmented
            name="clientMode"
            value={clientMode}
            onChange={setClientMode}
            options={[
              { value: "existing", label: "Cliente registrado" },
              { value: "new", label: "Cliente nuevo" },
            ]}
          />
        </div>
        {clientMode === "existing" ? (
          <div className="sm:col-span-2">
            <SelectField label="Cliente" name="clientId" options={clients} placeholder="Elige un cliente" required />
          </div>
        ) : (
          <>
            <SelectField label="Documento" name="taxIdType" options={TAX_ID_OPTIONS} defaultValue="RUC" />
            <Field label="Número" name="taxId" inputMode="numeric" mono />
            <Field label="Razón social" name="legalName" required />
            <Field label="Persona de contacto" name="contactName" />
            <Field label="Correo" name="email" type="email" />
            <Field label="Teléfono" name="phone" type="tel" />
          </>
        )}
      </FormSection>

      <FormSection title="Servicio" description="Lo que pediste al cliente: modalidad, incoterm y ruta.">
        <div>
          <span className="text-sm font-medium text-ink">Operación</span>
          <div>
            <Segmented
              name="direction"
              value={direction}
              onChange={setDirection}
              options={[
                { value: "IMPORT", label: "Importación" },
                { value: "EXPORT", label: "Exportación" },
              ]}
            />
          </div>
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <span className="text-sm font-medium text-ink">Modalidad</span>
          <div>
            <Segmented
              name="mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: "SEA_LCL", label: "LCL" },
                { value: "SEA_FCL", label: "FCL" },
                { value: "AIR", label: "Aéreo" },
                { value: "ROAD", label: "Terrestre" },
              ]}
            />
          </div>
        </div>
        <SelectField label="Incoterm" name="incoterm" options={INCOTERMS.map((i) => ({ value: i, label: i }))} placeholder="Sin definir" />
        <PlaceField label="Origen" name="origin" options={locations} />
        <PlaceField label="Destino" name="destination" options={locations} defaultValue={direction === "IMPORT" ? defaultDestinationId : undefined} />
        <div className="sm:col-span-2 lg:col-span-3">
          <span className="text-sm font-medium text-ink">Incluye</span>
          <div className="mt-1 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            <Check name="includesFreight" label="Flete internacional" defaultChecked />
            <Check name="includesCustoms" label="Despacho de aduanas" defaultChecked />
            <Check name="includesInland" label="Transporte local" defaultChecked />
            <Check name="includesInsurance" label="Seguro" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Carga" description="Con esto se calculan solas las cantidades de la cotización (W/M, kg cobrable, contenedores).">
        <Field label="Mercadería" name="commodity" />
        <Field label="Peso bruto (kg)" name="grossWeightKg" type="number" step="0.001" inputMode="decimal" />
        <Field label="Volumen (m³)" name="volumeCbm" type="number" step="0.001" inputMode="decimal" />
        <Field label="Bultos" name="packages" type="number" step="1" inputMode="numeric" />
        <Field label="Tipo de bulto" name="packageType" placeholder="Paletas, cajas…" />
        <Field label="Valor de la mercadería (USD)" name="cargoValue" type="number" step="0.01" inputMode="decimal" hint="Para seguro y comisión por % del valor." />
        {mode === "SEA_FCL" && (
          <div className="sm:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-ink">Contenedores</span>
            <div className="mt-1.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {EQUIPMENT_OPTIONS.map((e) => (
                <label key={e.value} className="flex items-center gap-2 rounded-sm border border-rule bg-surface px-3 py-2">
                  <input
                    name={`cont_${e.value}`}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder="0"
                    className="tnum w-12 bg-transparent text-right focus:outline-none"
                  />
                  <span className="text-sm text-ink-2">× {e.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Referencias">
        <Field label="Referencia del cliente" name="clientReference" hint="Orden de compra o código que usa el cliente." />
        <div className="sm:col-span-2">
          <TextArea label="Notas internas" name="notes" placeholder="Detalle del requerimiento, contacto del proveedor, etc." />
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-end">
        <FormError message={state?.error} />
        <SubmitButton pending={pending} pendingLabel="Abriendo…" full={false}>
          Abrir expediente
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
