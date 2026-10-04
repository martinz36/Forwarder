import Link from "next/link";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { Badge, Code, Empty, PageHeader, Panel, Section, TextLink } from "@/components/ui";
import { MODE, QUOTE_STATUS, SHIPMENT_STATUS } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/pricing/totals";

export default async function DashboardPage() {
  const { organization, user } = await requireTenant();
  const db = getDb();
  const organizationId = organization.id;

  const [openQuotes, activeShipments, clients, recentQuotes] = await Promise.all([
    db.quote.count({ where: { organizationId, status: { in: ["DRAFT", "SENT"] } } }),
    db.shipment.findMany({
      where: { organizationId, status: { notIn: ["DELIVERED", "CLOSED", "CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { legalName: true } },
        milestones: { where: { status: "PENDING" }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    db.client.count({ where: { organizationId } }),
    db.quote.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: { select: { legalName: true } }, versions: { orderBy: { versionNo: "desc" }, take: 1 } },
    }),
  ]);

  const figures = [
    { label: "Cotizaciones abiertas", value: openQuotes, href: "/cotizaciones" },
    { label: "Embarques en curso", value: activeShipments.length, href: "/embarques" },
    { label: "Clientes", value: clients, href: "/clientes" },
  ];

  return (
    <>
      <PageHeader eyebrow={organization.legalName} title={`Hola, ${user.name.split(" ")[0]}`} />

      <dl className="mt-6 grid grid-cols-3 divide-x divide-rule rounded-md border border-rule bg-surface">
        {figures.map((f) => (
          <Link key={f.label} href={f.href} className="press group px-3 py-3 hover:bg-paper/50 sm:px-5 sm:py-4">
            <dt className="text-xs text-ink-3 sm:text-sm">{f.label}</dt>
            <dd className="tnum mt-1 font-mono text-lg font-medium text-ink sm:text-xl">{f.value}</dd>
          </Link>
        ))}
      </dl>

      <Section title="Embarques en curso" aside={<TextLink href="/embarques">Ver todos</TextLink>}>
        {activeShipments.length === 0 ? (
          <Empty title="No hay embarques en curso" />
        ) : (
          <Panel>
            <ul className="divide-y divide-rule">
              {activeShipments.map((s) => (
                <li key={s.id}>
                  <Link href={`/embarques/${s.number}`} className="press flex flex-col gap-1 px-4 py-3 hover:bg-paper/50 sm:flex-row sm:items-center sm:gap-4">
                    <Code className="font-medium text-navy sm:w-32">{s.number}</Code>
                    <span className="min-w-0 flex-1 truncate text-ink">{s.client.legalName}</span>
                    <span className="text-sm text-ink-3 sm:w-64 sm:truncate">
                      Siguiente: {s.milestones[0]?.name ?? "—"}
                    </span>
                    <Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </Section>

      <Section title="Cotizaciones recientes" aside={<TextLink href="/cotizaciones">Ver todas</TextLink>}>
        {recentQuotes.length === 0 ? (
          <Empty title="Aún no hay cotizaciones" />
        ) : (
          <Panel>
            <ul className="divide-y divide-rule">
              {recentQuotes.map((q) => {
                const v = q.versions[0];
                const totals = (v?.totals ?? {}) as Totals;
                return (
                  <li key={q.id}>
                    <Link href={`/cotizaciones/${q.number}`} className="press flex flex-col gap-1 px-4 py-3 hover:bg-paper/50 sm:flex-row sm:items-center sm:gap-4">
                      <Code className="font-medium text-navy sm:w-32">{q.number}</Code>
                      <span className="min-w-0 flex-1 truncate text-ink">{q.client.legalName}</span>
                      <span className="text-sm text-ink-3 sm:w-28">{v ? MODE[v.mode] : "—"}</span>
                      <span className="tnum text-sm text-ink sm:w-32 sm:text-right">
                        {totals.USD ? formatMoney(totals.USD.total, "USD") : totals.PEN ? formatMoney(totals.PEN.total, "PEN") : "—"}
                      </span>
                      <span className="flex items-center gap-3 sm:w-40 sm:justify-end">
                        <span className="text-xs text-ink-3">{formatDate(q.createdAt)}</span>
                        <Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </Section>
    </>
  );
}
