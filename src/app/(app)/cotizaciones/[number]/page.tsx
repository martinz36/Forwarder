import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { Badge, Code, Facts, PageHeader, Section, TextLink } from "@/components/ui";
import { LinesTable, TotalsBox } from "@/components/quote";
import { DIRECTION, EQUIPMENT, MODE, QUOTE_STATUS } from "@/lib/labels";
import { formatDate, formatVolume, formatWeight } from "@/lib/format";
import type { Totals } from "@/lib/pricing/totals";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).number) };
}

export default async function QuotePage({ params }: Props) {
  const number = decodeURIComponent((await params).number);
  const { organization } = await requireTenant();
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
        eyebrow={`Cotización · versión ${v.versionNo}`}
        title={<Code>{quote.number}</Code>}
        meta={
          <>
            <span className="font-medium text-ink">{quote.client.legalName}</span>
            <span>Creada {formatDate(quote.createdAt)}</span>
            {v.validUntil && <span>Válida hasta {formatDate(v.validUntil)}</span>}
            {quote.reference && <span>Ref. {quote.reference}</span>}
          </>
        }
        aside={
          <>
            {quote.shipment && (
              <TextLink href={`/embarques/${quote.shipment.number}`}>Embarque {quote.shipment.number}</TextLink>
            )}
            <Badge tone={status.tone}>{status.label}</Badge>
          </>
        }
      />

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
    </>
  );
}
