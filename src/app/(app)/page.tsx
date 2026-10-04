import Link from "next/link";
import type { ShipmentStatus } from "@/generated/prisma/enums";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { canEdit } from "@/server/action-utils";
import { Badge, Code, Empty, PageHeader, Panel, Section, TextLink } from "@/components/ui";
import { buttonClass } from "@/components/button";
import { MODE, SHIPMENT_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/format";

const ACTIVE: ShipmentStatus[] = ["CONFIRMED", "AT_ORIGIN", "IN_TRANSIT", "AT_DESTINATION", "CUSTOMS_CLEARANCE", "RELEASED", "OUT_FOR_DELIVERY", "DELIVERED"];

type Row = {
  id: string;
  number: string;
  status: ShipmentStatus;
  mode: keyof typeof MODE;
  eta: Date | null;
  createdAt: Date;
  client: { legalName: string };
  milestones: { name: string }[];
};

function ExpedienteList({ rows, showEta }: { rows: Row[]; showEta?: boolean }) {
  return (
    <Panel>
      <ul className="divide-y divide-rule">
        {rows.map((s) => (
          <li key={s.id}>
            <Link href={`/expedientes/${s.number}`} className="press flex flex-col gap-1 px-4 py-3 hover:bg-paper/50 sm:flex-row sm:items-center sm:gap-4">
              <Code className="font-medium text-navy sm:w-28">{s.number}</Code>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-ink">{s.client.legalName}</span>
                <span className="block truncate text-xs text-ink-3">
                  {MODE[s.mode]} · siguiente: {s.milestones[0]?.name ?? "—"}
                </span>
              </span>
              <span className="text-xs text-ink-3 sm:w-28 sm:text-right">{showEta ? `ETA ${formatDate(s.eta)}` : `Abierto ${formatDate(s.createdAt)}`}</span>
              <Badge tone={SHIPMENT_STATUS[s.status].tone}>{SHIPMENT_STATUS[s.status].label}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default async function DashboardPage() {
  const { organization, user, role } = await requireTenant();
  const db = getDb();
  const organizationId = organization.id;
  const include = {
    client: { select: { legalName: true } },
    milestones: { where: { status: "PENDING" as const }, orderBy: { sortOrder: "asc" as const }, take: 1, select: { name: true } },
  };

  const [quoting, active, clients] = await Promise.all([
    db.shipment.findMany({ where: { organizationId, status: "QUOTING" }, orderBy: { createdAt: "desc" }, include }),
    db.shipment.findMany({ where: { organizationId, status: { in: ACTIVE } }, orderBy: [{ eta: "asc" }, { createdAt: "desc" }], include }),
    db.client.count({ where: { organizationId } }),
  ]);

  const figures = [
    { label: "En cotización", value: quoting.length, href: "/expedientes?estado=cotizacion" },
    { label: "En curso", value: active.length, href: "/expedientes?estado=curso" },
    { label: "Clientes", value: clients, href: "/clientes" },
  ];

  return (
    <>
      <PageHeader
        eyebrow={organization.legalName}
        title={`Hola, ${user.name.split(" ")[0]}`}
        aside={
          canEdit(role) && (
            <Link href="/expedientes/nuevo" className={buttonClass("primary")}>
              Nueva solicitud
            </Link>
          )
        }
      />

      <dl className="mt-6 grid grid-cols-3 divide-x divide-rule rounded-md border border-rule bg-surface">
        {figures.map((f) => (
          <Link key={f.label} href={f.href} className="press group px-3 py-3 hover:bg-paper/50 sm:px-5 sm:py-4">
            <dt className="text-xs text-ink-3 sm:text-sm">{f.label}</dt>
            <dd className="tnum mt-1 font-mono text-lg font-medium text-ink sm:text-xl">{f.value}</dd>
          </Link>
        ))}
      </dl>

      <Section title="En cotización" description="Solicitudes esperando tarifa del agente o respuesta del cliente." aside={<TextLink href="/expedientes?estado=cotizacion">Ver todas</TextLink>}>
        {quoting.length === 0 ? <Empty title="Nada pendiente de cotizar" /> : <ExpedienteList rows={quoting} />}
      </Section>

      <Section title="En curso" description="Ordenados por fecha de llegada." aside={<TextLink href="/expedientes?estado=curso">Ver todos</TextLink>}>
        {active.length === 0 ? <Empty title="No hay embarques en curso" /> : <ExpedienteList rows={active} showEta />}
      </Section>
    </>
  );
}
