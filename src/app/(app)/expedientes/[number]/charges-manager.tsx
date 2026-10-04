"use client";

import { useActionState, useState } from "react";
import type { ChargeGroup, Currency, TaxTreatment } from "@/generated/prisma/enums";
import { addChargeAction, deleteChargeAction, recalcChargesAction, setChargeBillingAction, updateChargeAction } from "../billing-actions";
import { ActionForm, FormError } from "@/components/form";
import { GROUPS, TAX } from "@/lib/labels";
import { formatMoney, formatQuantity } from "@/lib/format";

export interface ChargeView {
  id: string;
  description: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  quantity: string;
  currency: Currency;
  unitCost: string;
  unitPrice: string;
  totalCost: string;
  totalPrice: string;
  source: "QUOTE" | "EXTRA" | "ADJUSTMENT";
  stage: "ARRIVAL_NOTICE" | "CUSTOMS_SETTLEMENT";
}

export interface ConceptPick {
  id: string;
  name: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  defaultCurrency: Currency;
  defaultCost: string | null;
  defaultPrice: string | null;
}

const SMALL_INPUT = "tnum w-full rounded-sm border border-rule bg-surface px-2 py-1 text-right text-sm focus:border-navy focus:outline-none";
const STAGE = { ARRIVAL_NOTICE: "Aviso de llegada", CUSTOMS_SETTLEMENT: "Liq. aduanas" };

/** Documento en que se cobra el cargo; se guarda al cambiar. */
function BillingSelect({ chargeId, number, value }: { chargeId: string; number: string; value: ChargeView["stage"] }) {
  const [state, action, pending] = useActionState(setChargeBillingAction, undefined);
  // Controlado y sin reinicio del formulario: si no, el select vuelve al valor anterior tras guardar.
  const [current, setCurrent] = useState(value);
  const shown = state?.error && !pending ? value : current;
  return (
    <ActionForm action={action} className="inline-flex items-center gap-1">
      <input type="hidden" name="chargeId" value={chargeId} />
      <input type="hidden" name="number" value={number} />
      <label className="sr-only" htmlFor={`billing-${chargeId}`}>Se cobra en</label>
      <span aria-hidden>→</span>
      <select
        id={`billing-${chargeId}`}
        name="billedIn"
        value={shown}
        disabled={pending}
        onChange={(e) => {
          setCurrent(e.currentTarget.value as ChargeView["stage"]);
          e.currentTarget.form?.requestSubmit();
        }}
        className="rounded-sm border border-transparent bg-transparent py-0 text-xs text-ink-3 hover:border-rule focus:border-navy focus:outline-none"
      >
        <option value="ARRIVAL_NOTICE">Aviso de llegada</option>
        <option value="CUSTOMS_SETTLEMENT">Liq. aduanas</option>
      </select>
      {state?.error && <span className="text-bad">{state.error}</span>}
    </ActionForm>
  );
}

/** Recalcula cantidades con el peso, volumen o contenedores finales del expediente. */
function RecalcButton({ shipmentId, number }: { shipmentId: string; number: string }) {
  const [state, action, pending] = useActionState(recalcChargesAction, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule bg-paper/40 px-4 py-2 text-sm">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="number" value={number} />
      <button disabled={pending} className="press font-medium text-navy hover:underline disabled:opacity-60">
        {pending ? "Recalculando…" : "Recalcular con peso / volumen final"}
      </button>
      <span className="text-xs text-ink-3">Usa los datos de carga del expediente (p. ej. lo verificado por el depósito).</span>
      {state?.ok && <span className="basis-full text-xs text-ok">{state.ok}</span>}
      {state?.error && <span className="basis-full text-xs text-bad">{state.error}</span>}
    </form>
  );
}

function ChargeRow({ c, number, editable }: { c: ChargeView; number: string; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const [updateState, update, updating] = useActionState(updateChargeAction, undefined);
  const [deleteState, remove, removing] = useActionState(deleteChargeAction, undefined);
  const error = updateState?.error ?? deleteState?.error;

  return (
    <li className="px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <div className="text-ink">{c.description}</div>
          <div className="flex flex-wrap gap-x-2 text-xs text-ink-3">
            <span>{GROUPS.find((g) => g.group === c.group)?.label}</span>
            <span className={c.taxTreatment === "TAXED" ? "" : "text-warn"}>{TAX[c.taxTreatment]}</span>
            {editable ? <BillingSelect key={c.stage} chargeId={c.id} number={number} value={c.stage} /> : <span>→ {STAGE[c.stage]}</span>}
            {c.source === "EXTRA" && <span className="font-medium text-signal">Adicional</span>}
            {c.source === "ADJUSTMENT" && <span className="font-medium text-signal">Ajustado</span>}
          </div>
        </div>
        {!editing && (
          <>
            <span className="tnum text-sm text-ink-3">
              {formatQuantity(c.quantity)} × {formatMoney(c.unitPrice, c.currency)}
            </span>
            <span className="tnum w-28 text-right font-medium text-ink">{formatMoney(c.totalPrice, c.currency)}</span>
            <span className="tnum hidden w-24 text-right text-xs text-ink-3 lg:inline">costo {formatMoney(c.totalCost, c.currency)}</span>
            {editable && (
              <span className="flex gap-1">
                <button type="button" onClick={() => setEditing(true)} className="press rounded-sm px-2 py-1 text-sm text-navy hover:bg-navy/5">
                  Editar
                </button>
                <form action={remove}>
                  <input type="hidden" name="chargeId" value={c.id} />
                  <input type="hidden" name="number" value={number} />
                  <button
                    disabled={removing}
                    onClick={(e) => {
                      if (!confirm(`¿Quitar "${c.description}" del expediente?`)) e.preventDefault();
                    }}
                    className="press rounded-sm px-2 py-1 text-sm text-bad hover:bg-bad/10"
                  >
                    Quitar
                  </button>
                </form>
              </span>
            )}
          </>
        )}
      </div>
      {editing && (
        <form
          action={(fd) => {
            update(fd);
            setEditing(false);
          }}
          className="mt-2 grid grid-cols-3 items-end gap-2 sm:grid-cols-[6rem_8rem_8rem_auto]"
        >
          <input type="hidden" name="chargeId" value={c.id} />
          <input type="hidden" name="number" value={number} />
          <label className="text-xs text-ink-3">
            Cantidad
            <input name="quantity" type="number" step="0.001" defaultValue={c.quantity} className={SMALL_INPUT} />
          </label>
          <label className="text-xs text-ink-3">
            Costo unit.
            <input name="unitCost" type="number" step="0.01" defaultValue={c.unitCost} className={SMALL_INPUT} />
          </label>
          <label className="text-xs text-ink-3">
            Precio unit.
            <input name="unitPrice" type="number" step="0.01" defaultValue={c.unitPrice} className={SMALL_INPUT} />
          </label>
          <span className="col-span-3 flex gap-2 sm:col-span-1">
            <button disabled={updating} className="press rounded-sm bg-signal px-3 py-1.5 text-sm font-medium text-white">
              Guardar
            </button>
            <button type="button" onClick={() => setEditing(false)} className="press px-2 py-1.5 text-sm text-ink-3">
              Cancelar
            </button>
          </span>
        </form>
      )}
      <FormError message={error} />
    </li>
  );
}

function AddCharge({ shipmentId, number, concepts }: { shipmentId: string; number: string; concepts: ConceptPick[] }) {
  const [open, setOpen] = useState(false);
  const [state, add, pending] = useActionState(addChargeAction, undefined);
  const [form, setForm] = useState({ conceptId: "", description: "", group: "CUSTOMS", taxTreatment: "TAXED", currency: "USD", unitCost: "", unitPrice: "" });

  if (!open) {
    return (
      <div className="border-t border-rule px-4 py-3">
        <button type="button" onClick={() => setOpen(true)} className="press text-sm font-medium text-navy hover:underline">
          + Agregar cargo adicional
        </button>
        <span className="ml-2 text-xs text-ink-3">Variación de tarifa, aforo por canal rojo, almacenaje extra…</span>
        {state?.ok && <span className="ml-2 text-xs text-ok">{state.ok}</span>}
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        add(fd);
        setOpen(false);
      }}
      className="space-y-3 border-t border-rule bg-paper/40 px-4 py-3"
    >
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <input type="hidden" name="number" value={number} />
      <input type="hidden" name="conceptId" value={form.conceptId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-ink-3">
          Del catálogo
          <select
            value={form.conceptId}
            onChange={(e) => {
              const c = concepts.find((x) => x.id === e.target.value);
              setForm(
                c
                  ? { conceptId: c.id, description: c.name, group: c.group, taxTreatment: c.taxTreatment, currency: c.defaultCurrency, unitCost: c.defaultCost ?? "", unitPrice: c.defaultPrice ?? "" }
                  : { ...form, conceptId: "" },
              );
            }}
            className="mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
          >
            <option value="">— concepto libre —</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-3">
          Descripción
          <input
            name="description"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm text-ink"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_5rem_6rem_7rem_7rem]">
        <label className="text-xs text-ink-3">
          Sección
          <select name="group" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} className="mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm text-ink">
            {GROUPS.map((g) => (
              <option key={g.group} value={g.group}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-3">
          Tributo
          <select name="taxTreatment" value={form.taxTreatment} onChange={(e) => setForm({ ...form, taxTreatment: e.target.value })} className="mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm text-ink">
            {(Object.keys(TAX) as TaxTreatment[]).map((t) => (
              <option key={t} value={t}>
                {TAX[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-3">
          Moneda
          <select name="currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1 block w-full rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm text-ink">
            <option value="USD">USD</option>
            <option value="PEN">S/</option>
          </select>
        </label>
        <label className="text-xs text-ink-3">
          Cantidad
          <input name="quantity" type="number" step="0.001" defaultValue="1" className={`mt-1 ${SMALL_INPUT}`} />
        </label>
        <label className="text-xs text-ink-3">
          Costo unit.
          <input name="unitCost" type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} className={`mt-1 ${SMALL_INPUT}`} />
        </label>
        <label className="text-xs text-ink-3">
          Precio unit.
          <input name="unitPrice" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className={`mt-1 ${SMALL_INPUT}`} />
        </label>
      </div>
      <div className="flex gap-2">
        <button disabled={pending} className="press rounded-sm bg-signal px-3 py-1.5 text-sm font-medium text-white">
          Agregar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="press px-2 py-1.5 text-sm text-ink-3">
          Cancelar
        </button>
      </div>
      <FormError message={state?.error} />
    </form>
  );
}

export function ChargesManager({
  shipmentId,
  number,
  charges,
  concepts,
  editable,
}: {
  shipmentId: string;
  number: string;
  charges: ChargeView[];
  concepts: ConceptPick[];
  editable: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-rule bg-surface">
      {editable && charges.length > 0 && <RecalcButton shipmentId={shipmentId} number={number} />}
      {charges.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-3">Aún no hay cargos. Se cargan al aceptar la cotización.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {charges.map((c) => (
            <ChargeRow key={c.id} c={c} number={number} editable={editable} />
          ))}
        </ul>
      )}
      {editable && <AddCharge shipmentId={shipmentId} number={number} concepts={concepts} />}
    </div>
  );
}
