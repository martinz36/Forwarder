import type { Metadata } from "next";
import Link from "next/link";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { Badge, Code, Empty, PageHeader, Panel } from "@/components/ui";
import { MODE, SHIPMENT_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Embarques" };

export default async function ShipmentsPage() {
  const { organization } = await requireTenant();
  const shipments = await getDb().shipment.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { legalName: true } },
      origin: { select: { name: true } },
      destination: { select: { name: true } },
      milestones: { where: { status: "PENDING" }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  return (
    <>
      <PageHeader title="Embarques" meta={<span>{shipments.length} en total</span>} />
      <div className="mt-6">
        {shipments.length === 0 ? (
          <Empty title="Aún no hay embarques">Se crean al aceptar una cotización.</Empty>
        ) : (
          <Panel>
            <div className="hidden grid-cols-[8rem_1fr_10rem_7rem_9rem] gap-4 border-b border-rule bg-paper/60 px-4 py-2 text-xs font-medium text-ink-3 md:grid">
              <span>Número</span>
              <span>Cliente · siguiente hito</span>
              <span>Ruta</span>
              <span>ETA</span>
              <span>Estado</span>
            </div>
            <ul className="divide-y divide-rule">
              {shipments.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/embarques/${s.number}`}
                    className="press grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper/50 md:grid-cols-[8rem_1fr_10rem_7rem_9rem] md:items-center"
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
