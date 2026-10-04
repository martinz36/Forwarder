import type { Metadata } from "next";
import Link from "next/link";
import type { ShipmentStatus } from "@/generated/prisma/enums";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { canEdit } from "@/server/action-utils";
import { Badge, Code, Empty, PageHeader, Panel } from "@/components/ui";
import { buttonClass } from "@/components/button";
import { MODE, SHIPMENT_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Expedientes" };

const TABS: { key: string; label: string; statuses: ShipmentStatus[] | null }[] = [
  { key: "cotizacion", label: "En cotización", statuses: ["QUOTING"] },
  {
    key: "curso",
    label: "En curso",
    statuses: ["CONFIRMED", "AT_ORIGIN", "IN_TRANSIT", "AT_DESTINATION", "CUSTOMS_CLEARANCE", "RELEASED", "OUT_FOR_DELIVERY", "DELIVERED"],
  },
  { key: "cerrados", label: "Cerrados", statuses: ["CLOSED", "LOST", "CANCELLED"] },
  { key: "todos", label: "Todos", statuses: null },
];

export default async function ExpedientesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { organization, role } = await requireTenant();
  const { estado } = await searchParams;
  const tab = TABS.find((t) => t.key === estado) ?? TABS[3]!;
  const db = getDb();

  const [shipments, counts] = await Promise.all([
    db.shipment.findMany({
      where: { organizationId: organization.id, ...(tab.statuses ? { status: { in: tab.statuses } } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { legalName: true } },
        origin: { select: { name: true } },
        destination: { select: { name: true } },
        milestones: { where: { status: "PENDING" }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    db.shipment.groupBy({ by: ["status"], where: { organizationId: organization.id }, _count: true }),
  ]);
  const countFor = (statuses: ShipmentStatus[] | null) =>
    counts.filter((c) => !statuses || statuses.includes(c.status)).reduce((sum, c) => sum + c._count, 0);

  return (
    <>
      <PageHeader
        title="Expedientes"
        meta={<span>Cada solicitud de un cliente abre un expediente; su número es la referencia para todo.</span>}
        aside={
          canEdit(role) && (
            <Link href="/expedientes/nuevo" className={buttonClass("primary")}>
              Nueva solicitud
            </Link>
          )
        }
      />

      <nav aria-label="Filtrar por etapa" className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex gap-1 whitespace-nowrap border-b border-rule">
          {TABS.map((t) => {
            const active = t.key === tab.key;
            return (
              <li key={t.key}>
                <Link
                  href={`/expedientes?estado=${t.key}`}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px block border-b-2 px-3 py-2 text-sm ${active ? "border-signal font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
                >
                  {t.label} <span className="tnum text-ink-3">{countFor(t.statuses)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4">
        {shipments.length === 0 ? (
          <Empty title="No hay expedientes en esta etapa" />
        ) : (
          <Panel>
            <div className="hidden grid-cols-[8rem_1fr_11rem_7rem_9rem] gap-4 border-b border-rule bg-paper/60 px-4 py-2 text-xs font-medium text-ink-3 md:grid">
              <span>Número</span>
              <span>Cliente · siguiente paso</span>
              <span>Ruta</span>
              <span>ETA</span>
              <span>Estado</span>
            </div>
            <ul className="divide-y divide-rule">
              {shipments.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/expedientes/${s.number}`}
                    className="press grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper/50 md:grid-cols-[8rem_1fr_11rem_7rem_9rem] md:items-center"
                  >
                    <Code className="font-medium text-navy">{s.number}</Code>
                    <span className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-start-auto">
                      <span className="block truncate text-ink">{s.client.legalName}</span>
                      <span className="block truncate text-xs text-ink-3">Siguiente: {s.milestones[0]?.name ?? "—"}</span>
                    </span>
                    <span className="col-span-2 truncate text-sm text-ink-2 md:col-span-1">
                      {MODE[s.mode]}
                      {s.origin && s.destination ? ` · ${s.origin.name} → ${s.destination.name}` : ""}
                    </span>
                    <span className="text-sm text-ink-3">{formatDate(s.eta)}</span>
                    <span className="col-start-2 row-start-1 justify-self-end md:col-start-auto md:row-start-auto md:justify-self-start">
                      <Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
