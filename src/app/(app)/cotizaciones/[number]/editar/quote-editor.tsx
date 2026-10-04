"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ChargeBasis, ChargeGroup, Currency, EquipmentType, TaxTreatment } from "@/generated/prisma/enums";
import { saveDraftAction } from "../../actions";
import { buttonClass } from "@/components/button";
import { BASIS, GROUPS, TAX } from "@/lib/labels";
import { INCOTERMS } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";
import { computeQuantity, lineAmount, type CargoMetrics } from "@/lib/pricing/quantity";
import { computeTotals } from "@/lib/pricing/totals";

export interface ConceptOption {
  id: string;
  name: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  defaultBasis: ChargeBasis;
  defaultCurrency: Currency;
  defaultCost: string | null;
  defaultPrice: string | null;
  defaultMinPrice: string | null;
}

export interface LineState {
  key: string;
  conceptId: string | null;
  description: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  basis: ChargeBasis;
  quantity: string;
  currency: Currency;
  unitCost: string;
  unitPrice: string;
  minPrice: string;
  isOptional: boolean;
  notes: string;
}

export interface HeaderState {
  incoterm: string;
  validUntil: string;
  originId: string;
  originText: string;
  destinationId: string;
  destinationText: string;
  carrierId: string;
  routing: string;
  frequency: string;
  transitTime: string;
  commodity: string;
  packages: string;
  packageType: string;
  grossWeightKg: string;
  volumeCbm: string;
  cargoValue: string;
  paymentTerms: string;
  notes: string;
  internalNotes: string;
}

type Option = { value: string; label: string };

const INPUT =
  "block w-full rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-ink transition-colors duration-150 hover:border-ink-3 focus:border-navy focus:outline-none";
const LABEL = "text-xs font-medium text-ink-3";

const BASIS_OPTIONS = (Object.keys(BASIS) as ChargeBasis[]).map((b) => ({ value: b, label: BASIS[b] || "manual" }));
const TAX_OPTIONS = (Object.keys(TAX) as TaxTreatment[]).map((t) => ({ value: t, label: TAX[t] }));

let keySeq = 0;
const newKey = () => `n${++keySeq}`;
const n = (v: string) => (v.trim() === "" ? 0 : Number(v));

function HField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className={LABEL}>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function QuoteEditor({
  versionId,
  number,
  header: initialHeader,
  lines: initialLines,
  concepts,
  locations,
  carriers,
  containers,
  taxRate,
  markupPct,
}: {
  versionId: string;
  number: string;
  header: HeaderState;
  lines: LineState[];
  concepts: ConceptOption[];
  locations: Option[];
  carriers: Option[];
  containers: { equipment: EquipmentType; quantity: number }[];
  taxRate: string;
  markupPct: string;
}) {
  const [header, setHeader] = useState(initialHeader);
  const [lines, setLines] = useState(initialLines);
  const [markup, setMarkup] = useState(markupPct);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const cargo: CargoMetrics = useMemo(
    () => ({
      grossWeightKg: header.grossWeightKg || null,
      volumeCbm: header.volumeCbm || null,
      packages: header.packages ? Number(header.packages) : null,
      containers,
      cifValue: header.cargoValue || null,
      fobValue: header.cargoValue || null,
    }),
    [header.grossWeightKg, header.volumeCbm, header.packages, header.cargoValue, containers],
  );

  const setH = (patch: Partial<HeaderState>) => {
    setHeader((h) => ({ ...h, ...patch }));
    setDirty(true);
  };
  const setLine = (key: string, patch: Partial<LineState>) => {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setDirty(true);
  };

  function addConcept(id: string) {
    const c = concepts.find((x) => x.id === id);
    if (!c) return;
    const qty = computeQuantity(c.defaultBasis, cargo);
    setLines((ls) => [
      ...ls,
      {
        key: newKey(),
        conceptId: c.id,
        description: c.name,
        group: c.group,
        taxTreatment: c.taxTreatment,
        basis: c.defaultBasis,
        quantity: qty ? qty.toString() : "1",
        currency: c.defaultCurrency,
        unitCost: c.defaultCost ?? "0",
        unitPrice: c.defaultPrice ?? "0",
        minPrice: c.defaultMinPrice ?? "",
        isOptional: false,
        notes: "",
      },
    ]);
    setDirty(true);
  }

  function addBlank() {
    setLines((ls) => [
      ...ls,
      {
        key: newKey(),
        conceptId: null,
        description: "",
        group: "DESTINATION",
        taxTreatment: "TAXED",
        basis: "PER_SHIPMENT",
        quantity: "1",
        currency: "USD",
        unitCost: "0",
        unitPrice: "0",
        minPrice: "",
        isOptional: false,
        notes: "",
      },
    ]);
    setDirty(true);
  }

  function move(key: string, delta: number) {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.key === key);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= ls.length) return ls;
      const copy = [...ls];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });
    setDirty(true);
  }

  function recalcQuantities() {
    setLines((ls) =>
      ls.map((l) => {
        if (l.basis === "MANUAL" || l.basis === "PER_SHIPMENT") return l;
        const qty = computeQuantity(l.basis, cargo);
        return qty ? { ...l, quantity: qty.toString() } : l;
      }),
    );
    setDirty(true);
  }

  function applyMarkup() {
    const factor = 1 + n(markup) / 100;
    setLines((ls) =>
      ls.map((l) => (n(l.unitCost) > 0 && n(l.unitPrice) === 0 ? { ...l, unitPrice: (Math.round(n(l.unitCost) * factor * 100) / 100).toString() } : l)),
    );
    setDirty(true);
  }

  const computed = lines.map((l) => ({
    ...l,
    totalPrice: lineAmount({ quantity: n(l.quantity), unitAmount: n(l.unitPrice), minAmount: l.minPrice ? n(l.minPrice) : null }),
    totalCost: lineAmount({ quantity: n(l.quantity), unitAmount: n(l.unitCost) }),
  }));
  const totals = computeTotals(
    computed.map((l) => ({ currency: l.currency, taxTreatment: l.taxTreatment, totalPrice: l.totalPrice, totalCost: l.totalCost, isOptional: l.isOptional })),
    taxRate,
  );

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveDraftAction(versionId, number, {
        ...header,
        lines: lines.map((l) => ({
          conceptId: l.conceptId,
          description: l.description,
          group: l.group,
          taxTreatment: l.taxTreatment,
          basis: l.basis,
          quantity: n(l.quantity),
          currency: l.currency,
          unitCost: n(l.unitCost),
          unitPrice: n(l.unitPrice),
          minPrice: l.minPrice ? n(l.minPrice) : null,
          isOptional: l.isOptional,
          notes: l.notes,
        })),
      });
      setMessage(result ?? null);
      if (result?.ok) setDirty(false);
    });
  }

  const conceptGroups = GROUPS.map((g) => ({ ...g, items: concepts.filter((c) => c.group === g.group) })).filter((g) => g.items.length);

  return (
    <div className="pb-28">
      {/* Datos */}
      <section className="rounded-md border border-rule bg-surface p-4 sm:p-5">
        <h2 className="text-md font-semibold">Servicio y carga</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HField label="Incoterm">
            <select value={header.incoterm} onChange={(e) => setH({ incoterm: e.target.value })} className={INPUT}>
              <option value="">Sin definir</option>
              {INCOTERMS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </HField>
          <HField label="Válida hasta">
            <input type="date" value={header.validUntil} onChange={(e) => setH({ validUntil: e.target.value })} className={INPUT} />
          </HField>
          <HField label="Origen">
            <select value={header.originId} onChange={(e) => setH({ originId: e.target.value })} className={INPUT}>
              <option value="">{header.originText || "Sin definir"}</option>
              {locations.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </HField>
          <HField label="Destino">
            <select value={header.destinationId} onChange={(e) => setH({ destinationId: e.target.value })} className={INPUT}>
              <option value="">{header.destinationText || "Sin definir"}</option>
              {locations.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </HField>
          <HField label="Naviera / aerolínea">
            <select value={header.carrierId} onChange={(e) => setH({ carrierId: e.target.value })} className={INPUT}>
              <option value="">Sin definir</option>
              {carriers.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </HField>
          <HField label="Tiempo de tránsito">
            <input value={header.transitTime} onChange={(e) => setH({ transitTime: e.target.value })} placeholder="30 días" className={INPUT} />
          </HField>
          <HField label="Frecuencia">
            <input value={header.frequency} onChange={(e) => setH({ frequency: e.target.value })} placeholder="Semanal" className={INPUT} />
          </HField>
          <HField label="Ruta">
            <input value={header.routing} onChange={(e) => setH({ routing: e.target.value })} placeholder="Directo / transbordo" className={INPUT} />
          </HField>
          <HField label="Mercadería" className="sm:col-span-2">
            <input value={header.commodity} onChange={(e) => setH({ commodity: e.target.value })} className={INPUT} />
          </HField>
          <HField label="Peso (kg)">
            <input type="number" step="0.001" inputMode="decimal" value={header.grossWeightKg} onChange={(e) => setH({ grossWeightKg: e.target.value })} className={`${INPUT} tnum`} />
          </HField>
          <HField label="Volumen (m³)">
            <input type="number" step="0.001" inputMode="decimal" value={header.volumeCbm} onChange={(e) => setH({ volumeCbm: e.target.value })} className={`${INPUT} tnum`} />
          </HField>
          <HField label="Bultos">
            <div className="flex gap-2">
              <input type="number" step="1" value={header.packages} onChange={(e) => setH({ packages: e.target.value })} className={`${INPUT} tnum w-20`} />
              <input value={header.packageType} onChange={(e) => setH({ packageType: e.target.value })} placeholder="tipo" className={INPUT} />
            </div>
          </HField>
          <HField label="Valor mercadería (USD)">
            <input type="number" step="0.01" value={header.cargoValue} onChange={(e) => setH({ cargoValue: e.target.value })} className={`${INPUT} tnum`} />
          </HField>
          <HField label="Forma de pago" className="sm:col-span-2">
            <input value={header.paymentTerms} onChange={(e) => setH({ paymentTerms: e.target.value })} placeholder="Contado / crédito 15 días" className={INPUT} />
          </HField>
        </div>
      </section>

      {/* Conceptos */}
      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-md font-semibold">Conceptos</h2>
            <p className="text-sm text-ink-3">Pon el costo de tu agente y el precio al cliente. Las opcionales se muestran aparte y no suman.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button type="button" onClick={recalcQuantities} className={buttonClass("secondary")}>
              Recalcular cantidades
            </button>
            <span className="flex items-center gap-1.5 rounded-sm border border-rule bg-surface px-2 py-1">
              <span className="text-ink-3">Margen</span>
              <input
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                inputMode="decimal"
                className="tnum w-12 bg-transparent text-right focus:outline-none"
                aria-label="Margen en porcentaje"
              />
              <span className="text-ink-3">%</span>
              <button type="button" onClick={applyMarkup} className="press rounded-sm px-2 py-0.5 font-medium text-navy hover:bg-navy/5">
                Aplicar a líneas sin precio
              </button>
            </span>
          </div>
        </div>

        <ol className="mt-3 space-y-2">
          {computed.map((l, i) => (
            <li key={l.key} className={`rounded-md border bg-surface p-3 ${l.isOptional ? "border-dashed border-rule" : "border-rule"}`}>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1fr)_5rem_9.5rem_4.75rem_6.25rem_6.25rem_7.5rem] md:items-end">
                <HField label="Concepto" className="col-span-2 md:col-span-1">
                  <input value={l.description} onChange={(e) => setLine(l.key, { description: e.target.value })} className={INPUT} />
                </HField>
                <HField label="Cantidad">
                  <input type="number" step="0.001" inputMode="decimal" value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} className={`${INPUT} tnum text-right`} />
                </HField>
                <HField label="Unidad">
                  <select value={l.basis} onChange={(e) => setLine(l.key, { basis: e.target.value as ChargeBasis })} className={INPUT}>
                    {BASIS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </HField>
                <HField label="Moneda">
                  <select value={l.currency} onChange={(e) => setLine(l.key, { currency: e.target.value as Currency })} className={INPUT}>
                    <option value="USD">USD</option>
                    <option value="PEN">S/</option>
                  </select>
                </HField>
                <HField label="Costo unit.">
                  <input type="number" step="0.01" inputMode="decimal" value={l.unitCost} onChange={(e) => setLine(l.key, { unitCost: e.target.value })} className={`${INPUT} tnum text-right text-ink-2`} />
                </HField>
                <HField label="Precio unit.">
                  <input type="number" step="0.01" inputMode="decimal" value={l.unitPrice} onChange={(e) => setLine(l.key, { unitPrice: e.target.value })} className={`${INPUT} tnum text-right font-medium`} />
                </HField>
                <div className="col-span-2 text-right md:col-span-1">
                  <span className={LABEL}>Total</span>
                  <div className="tnum mt-1 py-1.5 font-mono font-medium text-ink">{formatMoney(l.totalPrice, l.currency)}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-2 text-sm">
                <select value={l.group} onChange={(e) => setLine(l.key, { group: e.target.value as ChargeGroup })} aria-label="Sección" className="rounded-sm border border-rule bg-surface px-2 py-1 text-sm text-ink-2">
                  {GROUPS.map((g) => (
                    <option key={g.group} value={g.group}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <select value={l.taxTreatment} onChange={(e) => setLine(l.key, { taxTreatment: e.target.value as TaxTreatment })} aria-label="Tratamiento tributario" className="rounded-sm border border-rule bg-surface px-2 py-1 text-sm text-ink-2">
                  {TAX_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-ink-2">
                  Mínimo
                  <input type="number" step="0.01" value={l.minPrice} onChange={(e) => setLine(l.key, { minPrice: e.target.value })} className="tnum w-20 rounded-sm border border-rule bg-surface px-2 py-1 text-right" />
                </label>
                <label className="flex cursor-pointer items-center gap-1.5 text-ink-2">
                  <input type="checkbox" checked={l.isOptional} onChange={(e) => setLine(l.key, { isOptional: e.target.checked })} className="h-4 w-4 accent-[#c2410c]" />
                  Opcional
                </label>
                <span className="tnum text-xs text-ink-3">Costo total {formatMoney(l.totalCost, l.currency)}</span>
                <span className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => move(l.key, -1)} disabled={i === 0} aria-label="Subir" className="press rounded-sm px-2 py-1 text-ink-3 hover:bg-ink/5 disabled:opacity-30">
                    ↑
                  </button>
                  <button type="button" onClick={() => move(l.key, 1)} disabled={i === computed.length - 1} aria-label="Bajar" className="press rounded-sm px-2 py-1 text-ink-3 hover:bg-ink/5 disabled:opacity-30">
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLines((ls) => ls.filter((x) => x.key !== l.key));
                      setDirty(true);
                    }}
                    className="press rounded-sm px-2 py-1 text-bad hover:bg-bad/10"
                  >
                    Quitar
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            value=""
            onChange={(e) => e.target.value && addConcept(e.target.value)}
            className="block w-full rounded-sm border border-dashed border-ink-3 bg-surface px-3 py-2 text-ink sm:max-w-md"
            aria-label="Agregar concepto del catálogo"
          >
            <option value="">+ Agregar concepto del catálogo…</option>
            {conceptGroups.map((g) => (
              <optgroup key={g.group} label={g.label}>
                {g.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" onClick={addBlank} className={buttonClass("quiet")}>
            + Línea libre
          </button>
        </div>
      </section>

      {/* Observaciones */}
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <HField label="Observaciones (las ve el cliente en el PDF)">
          <textarea rows={4} value={header.notes} onChange={(e) => setH({ notes: e.target.value })} className={INPUT} />
        </HField>
        <HField label="Notas internas (no salen en el PDF)">
          <textarea rows={4} value={header.internalNotes} onChange={(e) => setH({ internalNotes: e.target.value })} className={INPUT} />
        </HField>
      </section>

      {/* Barra fija con totales y guardar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-surface/95 backdrop-blur lg:left-[232px]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 lg:px-10">
          <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1">
            {Object.entries(totals).map(([cur, t]) => (
              <div key={cur} className="text-sm">
                <span className="tnum font-mono text-md font-medium text-ink">{formatMoney(t.total, cur)}</span>
                <span className="ml-2 text-xs text-ink-3">
                  IGV {formatMoney(t.tax, cur)} · margen <span className="text-ok">{formatMoney(t.margin, cur)}</span>
                </span>
              </div>
            ))}
            {lines.length === 0 && <span className="text-sm text-ink-3">Agrega conceptos para ver el total.</span>}
          </div>
          <div className="flex items-center gap-3">
            <span role="status" className={`text-sm ${message?.error ? "text-bad" : "text-ok"}`}>
              {message?.error ?? (dirty ? <span className="text-ink-3">Cambios sin guardar</span> : message?.ok)}
            </span>
            <Link href={`/cotizaciones/${number}`} className={buttonClass("quiet")}>
              Volver
            </Link>
            <button type="button" onClick={save} disabled={pending} className={`${buttonClass("primary")} disabled:opacity-70`}>
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
