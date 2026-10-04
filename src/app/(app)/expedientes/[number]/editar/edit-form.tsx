"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateExpedienteAction } from "../../actions";
import { ActionForm, Field, FormError, FormSection, SelectField, SubmitButton, TextArea } from "@/components/form";
import { buttonClass } from "@/components/button";
import { CHANNEL_OPTIONS, EQUIPMENT_OPTIONS, INCOTERMS, REGIME_OPTIONS } from "@/lib/catalog";

type Option = { value: string; label: string };

/** Elegir un proveedor de la lista o escribir uno nuevo. */
function PartnerField({ label, name, options, defaultValue }: { label: string; name: string; options: Option[]; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div>
      <label className="block">
        <span className="text-sm font-medium text-ink">{label}</span>
        <select
          name={value === "__new" ? undefined : name}
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
          <option value="__new">Nuevo…</option>
        </select>
      </label>
      {value === "__new" && (
        <input
          name={`${name}New`}
          placeholder="Nombre"
          className="mt-2 block w-full rounded-sm border border-rule bg-surface px-3 py-2 text-ink focus:border-navy focus:outline-none"
        />
      )}
    </div>
  );
}

export interface EditDefaults {
  mode: string;
  incoterm: string | null;
  originId: string | null;
  destinationId: string | null;
  carrierId: string | null;
  agentId: string | null;
  warehouseId: string | null;
  clientReference: string | null;
  bookingNumber: string | null;
  mblNumber: string | null;
  hblNumber: string | null;
  vessel: string | null;
  voyage: string | null;
  flightNumber: string | null;
  etd: string;
  eta: string;
  atd: string;
  ata: string;
  freeDays: number | null;
  commodity: string | null;
  packages: number | null;
  packageType: string | null;
  grossWeightKg: string | null;
  volumeCbm: string | null;
  cargoValue: string | null;
  containers: Record<string, number>;
  internalNotes: string | null;
  regime: string;
  declarationNumber: string | null;
  channel: string | null;
  releasedAt: string;
}

export function EditExpedienteForm({
  shipmentId,
  number,
  d,
  locations,
  carriers,
  agents,
  warehouses,
}: {
  shipmentId: string;
  number: string;
  d: EditDefaults;
  locations: Option[];
  carriers: Option[];
  agents: Option[];
  warehouses: Option[];
}) {
  const [state, action, pending] = useActionState(updateExpedienteAction.bind(null, shipmentId, number), undefined);
  const isAir = d.mode === "AIR";

  return (
    <ActionForm action={action} className="space-y-8">
      <input type="hidden" name="mode" value={d.mode} />

      <FormSection title="Transporte">
        <SelectField label="Incoterm" name="incoterm" options={INCOTERMS.map((i) => ({ value: i, label: i }))} defaultValue={d.incoterm} placeholder="Sin definir" />
        <SelectField label="Origen" name="originId" options={locations} defaultValue={d.originId} placeholder="Sin definir" />
        <SelectField label="Destino" name="destinationId" options={locations} defaultValue={d.destinationId} placeholder="Sin definir" />
        <PartnerField label="Agente de carga" name="agentId" options={agents} defaultValue={d.agentId} />
        <PartnerField label={isAir ? "Aerolínea" : "Naviera"} name="carrierId" options={carriers} defaultValue={d.carrierId} />
        <PartnerField label="Depósito temporal / almacén" name="warehouseId" options={warehouses} defaultValue={d.warehouseId} />
        <Field label="Booking" name="bookingNumber" defaultValue={d.bookingNumber} mono />
        <Field label={isAir ? "MAWB" : "MBL"} name="mblNumber" defaultValue={d.mblNumber} mono />
        <Field label={isAir ? "HAWB" : "HBL"} name="hblNumber" defaultValue={d.hblNumber} mono />
        {isAir ? (
          <Field label="Vuelo" name="flightNumber" defaultValue={d.flightNumber} />
        ) : (
          <>
            <Field label="Nave" name="vessel" defaultValue={d.vessel} />
            <Field label="Viaje" name="voyage" defaultValue={d.voyage} />
          </>
        )}
        <Field label="ETD (salida estimada)" name="etd" type="date" defaultValue={d.etd} />
        <Field label="ETA (llegada estimada)" name="eta" type="date" defaultValue={d.eta} />
        <Field label="Salida real" name="atd" type="date" defaultValue={d.atd} />
        <Field label="Llegada real" name="ata" type="date" defaultValue={d.ata} />
        {!isAir && <Field label="Días libres de sobrestadía" name="freeDays" type="number" step="1" defaultValue={d.freeDays} />}
      </FormSection>

      <FormSection title="Carga">
        <Field label="Mercadería" name="commodity" defaultValue={d.commodity} />
        <Field label="Peso bruto (kg)" name="grossWeightKg" type="number" step="0.001" inputMode="decimal" defaultValue={d.grossWeightKg} />
        <Field label="Volumen (m³)" name="volumeCbm" type="number" step="0.001" inputMode="decimal" defaultValue={d.volumeCbm} />
        <Field label="Bultos" name="packages" type="number" step="1" defaultValue={d.packages} />
        <Field label="Tipo de bulto" name="packageType" defaultValue={d.packageType} />
        <Field label="Valor de la mercadería (USD)" name="cargoValue" type="number" step="0.01" defaultValue={d.cargoValue} />
        {d.mode === "SEA_FCL" && (
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
                    defaultValue={d.containers[e.value] || undefined}
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

      <FormSection title="Aduana">
        <SelectField label="Régimen" name="regime" options={REGIME_OPTIONS} defaultValue={d.regime} />
        <Field label="N° de DAM" name="declarationNumber" defaultValue={d.declarationNumber} mono />
        <SelectField label="Canal" name="channel" options={CHANNEL_OPTIONS} defaultValue={d.channel} placeholder="Sin asignar" />
        <Field label="Fecha de levante" name="releasedAt" type="date" defaultValue={d.releasedAt} />
      </FormSection>

      <FormSection title="Referencias">
        <Field label="Referencia del cliente" name="clientReference" defaultValue={d.clientReference} />
        <div className="sm:col-span-2">
          <TextArea label="Notas internas" name="internalNotes" defaultValue={d.internalNotes} />
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-end">
        <FormError message={state?.error} />
        <Link href={`/expedientes/${number}`} className={buttonClass("quiet")}>
          Cancelar
        </Link>
        <SubmitButton pending={pending} pendingLabel="Guardando…" full={false}>
          Guardar cambios
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
