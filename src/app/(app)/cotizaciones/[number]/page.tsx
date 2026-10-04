import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { canEdit } from "@/server/action-utils";
import { Badge, Code, Facts, PageHeader, Panel, Section, TextLink } from "@/components/ui";
import { LinesTable, TotalsBox } from "@/components/quote";
import { DIRECTION, EQUIPMENT, MODE, QUOTE_STATUS, type Tone } from "@/lib/labels";
import { formatDate, formatDateTime, formatMoney, formatVolume, formatWeight } from "@/lib/format";
import type { Totals } from "@/lib/pricing/totals";
import { QuoteActions } from "./quote-actions";

const VERSION_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Borrador", tone: "neutral" },
  SENT: { label: "Enviada", tone: "info" },
  ACCEPTED: { label: "Aceptada", tone: "ok" },
  REJECTED: { label: "No aceptada", tone: "bad" },
  SUPERSEDED: { label: "Reemplazada", tone: "neutral" },
  EXPIRED: { label: "Vencida", tone: "warn" },
};

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).number) };
}

export default async function QuotePage({ params }: Props) {
  const number = decodeURIComponent((await params).number);
  const { organization, role } = await requireTenant();
  const quote = await getDb().quote.findUnique({
    where: { organizationId_number: { organizationId: organization.id, number } },
    include: {
      client: true,
      contact: true,
      shipment: { select: { number: true } },
      versions: {
        orderBy: { versionNo: "desc" },
        include: {
          lines: { orderBy: { sortOrder: "asc" } },
          equipment: true,
          origin: true,
          destination: true,
          carrier: true,
          shipper: true,
        },
      },
    },
  });
  if (!quote) notFound();

  const v = quote.versions[0];
  if (!v) notFound();
  const status = QUOTE_STATUS[quote.status];
  const place = (loc: { name: string; code: string } | null, text: string | null) =>
    loc ? `${loc.name} (${loc.code})` : text;

  return (
    <>
      <PageHeader
        eyebrow={`Cotización · versión ${v.versionNo} · ${VERSION_STATUS[v.status]?.label.toLowerCase()}`}
        title={<Code>{quote.number}</Code>}
        meta={
          <>
            <span className="font-medium text-ink">{quote.client.legalName}</span>
            <span>Creada {formatDate(quote.createdAt)}</span>
            {v.validUntil && <span>Válida hasta {formatDate(v.validUntil)}</span>}
            {v.sentAt && <span>Enviada {formatDate(v.sentAt)}</span>}
          </>
        }
        aside={
          <>
            {quote.shipment && (
              <TextLink href={`/expedientes/${quote.shipment.number}`}>Expediente {quote.shipment.number}</TextLink>
            )}
            <Badge tone={status.tone}>{status.label}</Badge>
          </>
        }
      />

      <div className="mt-5">
        <QuoteActions
          key={`${v.id}-${v.status}`}
          quoteId={quote.id}
          number={quote.number}
          versionId={v.id}
          versionNo={v.versionNo}
          status={v.status}
          editable={canEdit(role)}
          shipmentNumber={quote.shipment?.number ?? null}
        />
      </div>

      <Section title="Servicio y carga">
        <Facts
          items={[
            { label: "Servicio", value: `${DIRECTION[v.direction]} · ${MODE[v.mode]}` },
            { label: "Incoterm", value: v.incoterm },
            { label: "Origen", value: place(v.origin, v.originText) },
            { label: "Destino", value: place(v.destination, v.destinationText) },
            { label: v.mode === "AIR" ? "Aerolínea" : "Naviera", value: v.carrier?.name },
            { label: "Proveedor (shipper)", value: v.shipper?.name },
            { label: "Tránsito", value: v.transitTime },
            { label: "Frecuencia", value: v.frequency },
            { label: "Ruta", value: v.routing },
            { label: "ETD", value: v.etd ? formatDate(v.etd) : null },
            { label: "ETA", value: v.eta ? formatDate(v.eta) : null },
            { label: "Mercadería", value: v.commodity },
            { label: "Bultos", value: v.packages ? `${v.packages} ${v.packageType ?? ""}`.trim() : v.packageType },
            { label: "Peso", value: formatWeight(v.grossWeightKg) },
            { label: "Volumen", value: formatVolume(v.volumeCbm) },
            { label: "Contenedores", value: v.equipment.map((e) => `${e.quantity} × ${EQUIPMENT[e.equipment]}`).join(", ") },
            { label: "Forma de pago", value: v.paymentTerms },
          ]}
        />
      </Section>

      <Section title="Detalle de la cotización" description="El costo y el margen son de uso interno; el cliente no los ve.">
        <LinesTable lines={v.lines} />
      </Section>

      <Section title="Totales">
        <TotalsBox totals={(v.totals ?? {}) as Totals} taxRate={organization.taxRate} />
      </Section>

      {v.notes && (
        <Section title="Observaciones">
          <p className="whitespace-pre-line rounded-md border border-rule bg-surface px-4 py-3 text-ink-2">{v.notes}</p>
        </Section>
      )}

      <Section title="Condiciones">
        <details className="group rounded-md border border-rule bg-surface">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-navy marker:hidden">
            <span className="group-open:hidden">Ver condiciones generales</span>
            <span className="hidden group-open:inline">Ocultar condiciones</span>
          </summary>
          <p className="whitespace-pre-line border-t border-rule px-4 py-3 text-sm text-ink-2">
            {v.terms ?? organization.quoteTerms}
          </p>
        </details>
      </Section>

      {quote.versions.length > 1 && (
        <Section title="Versiones" description="Cada envío queda guardado tal como lo recibió el cliente.">
          <Panel>
            <ul className="divide-y divide-rule text-sm">
              {quote.versions.map((ver) => {
                const t = (ver.totals ?? {}) as Totals;
                const st = VERSION_STATUS[ver.status] ?? VERSION_STATUS.DRAFT!;
                return (
                  <li key={ver.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
                    <span className="font-medium text-ink">Versión {ver.versionNo}</span>
                    <span className="text-ink-3">{ver.sentAt ? `enviada ${formatDateTime(ver.sentAt)}` : `creada ${formatDateTime(ver.createdAt)}`}</span>
                    <span className="tnum ml-auto text-ink">
                      {Object.entries(t)
                        .map(([cur, x]) => formatMoney(x.total, cur))
                        .join(" + ") || "—"}
                    </span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <a
                      href={`/cotizaciones/${encodeURIComponent(quote.number)}/pdf?v=${ver.versionNo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-navy underline decoration-rule underline-offset-4"
                    >
                      PDF
                    </a>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </Section>
      )}
    </>
  );
}
