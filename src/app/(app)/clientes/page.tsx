import type { Metadata } from "next";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { Badge, Empty, PageHeader, Panel } from "@/components/ui";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage() {
  const { organization } = await requireTenant();
  const clients = await getDb().client.findMany({
    where: { organizationId: organization.id },
    orderBy: { legalName: "asc" },
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      _count: { select: { quotes: true, shipments: true } },
    },
  });

  return (
    <>
      <PageHeader title="Clientes" meta={<span>{clients.length} en total</span>} />
      <div className="mt-6">
        {clients.length === 0 ? (
          <Empty title="Aún no hay clientes" />
        ) : (
          <Panel>
            <ul className="divide-y divide-rule">
              {clients.map((c) => {
                const contact = c.contacts[0];
                return (
                  <li key={c.id} className="grid gap-x-6 gap-y-1 px-4 py-3 md:grid-cols-[1fr_14rem_10rem] md:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink">{c.legalName}</span>
                        {c.status !== "ACTIVE" && <Badge>{c.status === "INACTIVE" ? "Inactivo" : "Prospecto"}</Badge>}
                      </div>
                      <div className="font-mono text-xs text-ink-3">
                        {c.taxIdType} {c.taxId ?? "—"}
                      </div>
                    </div>
                    <div className="min-w-0 text-sm text-ink-2">
                      {contact ? (
                        <>
                          <div className="truncate">{contact.name}</div>
                          <div className="truncate text-xs text-ink-3">{[contact.email, contact.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}</div>
                        </>
                      ) : (
                        <span className="text-ink-3">Sin contacto</span>
                      )}
                    </div>
                    <div className="tnum text-sm text-ink-2 md:text-right">
                      {c._count.quotes} cotiz. · {c._count.shipments} embarques
                    </div>
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
