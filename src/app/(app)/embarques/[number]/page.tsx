import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { Badge, Code, Empty, Facts, PageHeader, Panel, Section, TextLink } from "@/components/ui";
import { LinesTable, TotalsBox } from "@/components/quote";
import { DIRECTION, DOC_STATUS, DOC_VISIBILITY, EQUIPMENT, MODE, SHIPMENT_STATUS } from "@/lib/labels";
import { formatDate, formatVolume, formatWeight } from "@/lib/format";
import { computeTotals } from "@/lib/pricing/totals";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).number) };
}

const CHANNEL = { GREEN: "Verde", ORANGE: "Naranja", RED: "Rojo" } as const;

export default async function ShipmentPage({ params }: Props) {
  const number = decodeURIComponent((await params).number);
  const { organization } = await requireTenant();
  const s = await getDb().shipment.findUnique({
    where: { organizationId_number: { organizationId: organization.id, number } },
    include: {
      client: true,
      origin: true,
      destination: true,
      carrier: true,
      shipper: true,
      containers: true,
      customsEntries: true,
      quotes: { select: { number: true } },
      milestones: { orderBy: { sortOrder: "asc" } },
      requirements: { orderBy: { sortOrder: "asc" } },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { type: true, versions: { orderBy: { versionNo: "desc" }, take: 1 } },
      },
      charges: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!s) notFound();

  const status = SHIPMENT_STATUS[s.status];
  const customs = s.customsEntries[0];
  const nextIndex = s.milestones.findIndex((m) => m.status === "PENDING");
  const containers = Object.entries(
    s.containers.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.equipment]: (acc[c.equipment] ?? 0) + 1 }), {}),
  )
    .map(([eq, n]) => `${n} × ${EQUIPMENT[eq as keyof typeof EQUIPMENT]}`)
    .join(", ");

  return (
    <>
      <PageHeader
        eyebrow={`Embarque · ${DIRECTION[s.direction]} ${MODE[s.mode]}`}
        title={<Code>{s.number}</Code>}
        meta={
          <>
            <span className="font-medium text-ink">{s.client.legalName}</span>
            <span>Creado {formatDate(s.createdAt)}</span>
            {s.quotes.map((q) => (
              <TextLink key={q.number} href={`/cotizaciones/${q.number}`}>
                {q.number}
              </TextLink>
            ))}
          </>
        }
        aside={<Badge tone={status.tone}>{status.label}</Badge>}
      />

      <Section title="Datos del embarque">
        <Facts
          items={[
            { label: "BL / HBL", value: s.hblNumber, mono: true },
            { label: "MBL", value: s.mblNumber, mono: true },
            { label: "Booking", value: s.bookingNumber, mono: true },
            { label: s.mode === "AIR" ? "Aerolínea" : "Naviera", value: s.carrier?.name },
            { label: "Origen", value: s.origin ? `${s.origin.name} (${s.origin.code})` : null },
            { label: "Destino", value: s.destination ? `${s.destination.name} (${s.destination.code})` : null },
            { label: "ETD", value: s.etd ? formatDate(s.etd) : null },
            { label: "ETA", value: s.eta ? formatDate(s.eta) : null },
            { label: "Incoterm", value: s.incoterm },
            { label: "Proveedor (shipper)", value: s.shipper?.name },
            { label: "Mercadería", value: s.commodity },
            { label: "Bultos", value: s.packages ? `${s.packages} ${s.packageType ?? ""}`.trim() : null },
            { label: "Peso", value: formatWeight(s.grossWeightKg) },
            { label: "Volumen", value: formatVolume(s.volumeCbm) },
            { label: "Contenedores", value: containers },
            { label: "DAM", value: customs?.declarationNumber, mono: true },
            { label: "Canal", value: customs?.channel ? CHANNEL[customs.channel] : null },
          ]}
        />
      </Section>

      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <Section title="Hitos" description="Lo que ve tu cliente aparece con el texto entre comillas.">
          <ol className="relative ml-1.5 border-l border-rule">
            {s.milestones.map((m, i) => {
              const done = m.status === "DONE";
              const next = i === nextIndex;
              return (
                <li key={m.id} className="relative pb-4 pl-5 last:pb-0">
                  <span
                    aria-hidden
                    className={`absolute -left-[6.5px] top-1 h-3 w-3 rounded-full border-2 ${
                      done ? "border-ok bg-ok" : next ? "border-signal bg-surface" : "border-rule bg-paper"
                    }`}
                  />
                  <div className={`text-base ${done ? "text-ink" : next ? "font-medium text-ink" : "text-ink-3"}`}>
                    {m.name}
                    {next && <span className="ml-2 text-xs font-medium text-signal">Siguiente</span>}
                  </div>
                  <div className="text-xs text-ink-3">
                    {m.clientVisible ? `“${m.clientLabel}”` : "Solo interno"}
                    {m.completedAt && ` · ${formatDate(m.completedAt)}`}
                    {m.note && ` · ${m.note}`}
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>

        <div>
          <Section title="Documentos">
            {s.documents.length === 0 ? (
              <Empty title="Sin documentos" />
            ) : (
              <Panel>
                <ul className="divide-y divide-rule">
                  {s.documents.map((d) => {
                    const file = d.versions[0];
                    const url = file?.externalUrl;
                    return (
                      <li key={d.id} className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-ink">
                            {url ? (
                              <a href={url} target="_blank" rel="noreferrer" className="underline decoration-rule underline-offset-4 hover:decoration-navy">
                                {d.title}
                              </a>
                            ) : (
                              d.title
                            )}
                          </div>
                          <div className="text-xs text-ink-3">
                            {d.type?.name ?? "Sin tipo"} · subido por {d.uploadedSide === "CLIENT" ? "el cliente" : "la agencia"} ·{" "}
                            {formatDate(file?.createdAt ?? d.createdAt)}
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <Badge tone={d.visibility === "CLIENT" ? "info" : "neutral"}>{DOC_VISIBILITY[d.visibility]}</Badge>
                          <Badge tone={DOC_STATUS[d.status].tone}>{DOC_STATUS[d.status].label}</Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}
          </Section>

          <Section title="Documentos requeridos">
            <Panel>
              <ul className="divide-y divide-rule">
                {s.requirements.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-ink">{r.title}</span>
                    <span className="flex items-center gap-2 text-xs text-ink-3">
                      {r.responsible === "CLIENT" ? "Cliente" : r.responsible === "STAFF" ? "Agencia" : "Tercero"}
                      <Badge tone={r.status === "PENDING" ? "warn" : "ok"}>{r.status === "PENDING" ? "Pendiente" : "Recibido"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </Section>
        </div>
      </div>

      <Section title="Cargos del embarque" description="Los de la cotización aceptada más los adicionales.">
        <LinesTable
          lines={s.charges.map((c) => ({
            ...c,
            note: (
              <>
                {c.source === "EXTRA" && <span className="text-signal">Adicional</span>}
                {c.requiresAdvance && <span>Se cobra como anticipo</span>}
              </>
            ),
          }))}
        />
        <div className="mt-3">
          <TotalsBox totals={computeTotals(s.charges, organization.taxRate.toString())} taxRate={organization.taxRate} />
        </div>
      </Section>
    </>
  );
}
