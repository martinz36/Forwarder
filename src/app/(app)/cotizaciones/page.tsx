import type { Metadata } from "next";
import Link from "next/link";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { Badge, Code, Empty, PageHeader, Panel } from "@/components/ui";
import { MODE, QUOTE_STATUS } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/pricing/totals";

export const metadata: Metadata = { title: "Cotizaciones" };

export default async function QuotesPage() {
  const { organization } = await requireTenant();
  const quotes = await getDb().quote.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { legalName: true } },
      shipment: { select: { number: true } },
      versions: { orderBy: { versionNo: "desc" }, take: 1 },
    },
  });

  return (
    <>
      <PageHeader title="Cotizaciones" meta={<span>{quotes.length} en total</span>} />
      <div className="mt-6">
        {quotes.length === 0 ? (
          <Empty title="Aún no hay cotizaciones" />
        ) : (
          <Panel>
            <div className="hidden grid-cols-[8rem_1fr_9rem_8rem_7rem_6rem] gap-4 border-b border-rule bg-paper/60 px-4 py-2 text-xs font-medium text-ink-3 md:grid">
              <span>Número</span>
              <span>Cliente</span>
              <span>Servicio</span>
              <span className="text-right">Total</span>
              <span>Fecha</span>
              <span>Estado</span>
            </div>
            <ul className="divide-y divide-rule">
              {quotes.map((q) => {
                const v = q.versions[0];
                const totals = (v?.totals ?? {}) as Totals;
                return (
                  <li key={q.id}>
                    <Link
                      href={`/cotizaciones/${q.number}`}
                      className="press grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper/50 md:grid-cols-[8rem_1fr_9rem_8rem_7rem_6rem] md:items-center"
                    >
                      <Code className="font-medium text-navy">{q.number}</Code>
                      <span className="col-span-2 row-start-2 min-w-0 truncate text-ink md:col-span-1 md:row-start-auto">
                        {q.client.legalName}
                      </span>
                      <span className="col-span-2 text-sm text-ink-2 md:col-span-1">
                        {v ? `${MODE[v.mode]}${v.incoterm ? ` · ${v.incoterm}` : ""}` : "—"}
                      </span>
                      <span className="tnum col-start-2 row-start-1 text-right text-ink md:col-start-auto md:row-start-auto">
                        {Object.entries(totals)
                          .map(([cur, t]) => formatMoney(t.total, cur))
                          .join(" + ") || "—"}
                      </span>
                      <span className="text-sm text-ink-3">{formatDate(q.createdAt)}</span>
                      <span className="flex items-center gap-2 justify-self-end md:justify-self-start">
                        <Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
