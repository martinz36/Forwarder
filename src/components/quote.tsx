import type { ChargeBasis, ChargeGroup, Currency, TaxTreatment } from "@/generated/prisma/enums";
import { BASIS, GROUPS, TAX } from "@/lib/labels";
import { formatMoney, formatQuantity } from "@/lib/format";
import type { Totals } from "@/lib/pricing/totals";

export interface LineView {
  id: string;
  description: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  basis: ChargeBasis;
  quantity: { toString(): string };
  currency: Currency;
  unitPrice: { toString(): string };
  totalPrice: { toString(): string };
  totalCost: { toString(): string };
  isOptional?: boolean;
  note?: React.ReactNode;
}

function LineRows({ lines }: { lines: LineView[] }) {
  return lines.map((l) => (
    <tr key={l.id} className="border-t border-rule align-top">
      <td className="py-2.5 pl-4 pr-3">
        <div className="text-ink">{l.description}</div>
        <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-ink-3">
          <span className={l.taxTreatment === "TAXED" ? "" : "text-warn"}>{TAX[l.taxTreatment]}</span>
          {l.note}
        </div>
      </td>
      <td className="tnum hidden whitespace-nowrap px-3 py-2.5 text-right text-ink-2 sm:table-cell">
        {formatQuantity(l.quantity)} {BASIS[l.basis]}
      </td>
      <td className="tnum hidden whitespace-nowrap px-3 py-2.5 text-right text-ink-2 md:table-cell">
        {formatMoney(l.unitPrice, l.currency)}
      </td>
      <td className="tnum whitespace-nowrap px-3 py-2.5 text-right font-medium text-ink">{formatMoney(l.totalPrice, l.currency)}</td>
      <td className="tnum hidden whitespace-nowrap py-2.5 pl-3 pr-4 text-right text-ink-3 lg:table-cell">
        {formatMoney(l.totalCost, l.currency)}
      </td>
    </tr>
  ));
}

/** Líneas agrupadas por sección, con las opcionales aparte. El costo es interno (solo personal). */
export function LinesTable({ lines }: { lines: LineView[] }) {
  const main = lines.filter((l) => !l.isOptional);
  const optional = lines.filter((l) => l.isOptional);
  const sections = GROUPS.map((g) => ({ ...g, lines: main.filter((l) => l.group === g.group) })).filter((s) => s.lines.length);

  return (
    <div className="overflow-hidden rounded-md border border-rule bg-surface">
      <table className="w-full text-base">
        <thead className="bg-paper/60 text-xs text-ink-3">
          <tr>
            <th className="py-2 pl-4 pr-3 text-left font-medium">Concepto</th>
            <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Cantidad</th>
            <th className="hidden px-3 py-2 text-right font-medium md:table-cell">P. unitario</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
            <th className="hidden py-2 pl-3 pr-4 text-right font-medium lg:table-cell">Costo</th>
          </tr>
        </thead>
        {sections.map((s) => (
          <tbody key={s.group}>
            <tr className="border-t border-rule">
              <th colSpan={5} className="bg-paper/40 py-1.5 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-navy">
                {s.label}
              </th>
            </tr>
            <LineRows lines={s.lines} />
          </tbody>
        ))}
        {optional.length > 0 && (
          <tbody>
            <tr className="border-t border-rule">
              <th colSpan={5} className="bg-paper/40 py-1.5 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-3">
                Opcionales · no suman al total
              </th>
            </tr>
            <LineRows lines={optional} />
          </tbody>
        )}
      </table>
    </div>
  );
}

/** Resumen por moneda. Margen visible solo para el personal. */
export function TotalsBox({ totals, taxRate }: { totals: Totals; taxRate: { toString(): string } }) {
  const currencies = (Object.keys(totals) as Currency[]).filter((c) => totals[c]);
  if (!currencies.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {currencies.map((c) => {
        const t = totals[c]!;
        const rows: [string, string, boolean?][] = [
          ["Servicios afectos", t.taxed],
          [`IGV ${taxRate.toString()}%`, t.tax],
          ...(Number(t.exempt) ? ([["Exonerado", t.exempt]] as [string, string][]) : []),
          ...(Number(t.unaffected) ? ([["Inafecto", t.unaffected]] as [string, string][]) : []),
          ["Reembolsos (origen, flete y terceros)", t.reimbursable],
        ];
        return (
          <div key={c} className="rounded-md border border-rule bg-surface">
            <dl className="divide-y divide-rule text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-2">
                  <dt className="text-ink-2">{label}</dt>
                  <dd className="tnum text-ink">{formatMoney(value, c)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 bg-navy px-4 py-2.5 text-white">
                <dt className="font-medium">Total {c === "PEN" ? "soles" : "dólares"}</dt>
                <dd className="tnum font-mono text-md font-medium">{formatMoney(t.total, c)}</dd>
              </div>
              <div className="flex justify-between gap-4 px-4 py-2 text-xs text-ink-3">
                <dt>Costo {formatMoney(t.cost, c)} · uso interno</dt>
                <dd className="tnum font-medium text-ok">Margen {formatMoney(t.margin, c)}</dd>
              </div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}
