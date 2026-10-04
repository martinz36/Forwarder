import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { canEdit } from "@/server/action-utils";
import { Badge, Code, Empty, Facts, PageHeader, Panel, Section, TextLink } from "@/components/ui";
import { TotalsBox } from "@/components/quote";
import { buttonClass } from "@/components/button";
import { DIRECTION, DOC_STATUS, DOC_VISIBILITY, EQUIPMENT, MODE, QUOTE_STATUS, SHIPMENT_STATUS } from "@/lib/labels";
import { formatDate, formatDateTime, formatMoney, formatVolume, formatWeight } from "@/lib/format";
import { computeTotals, type Totals } from "@/lib/pricing/totals";
import { Milestones } from "./milestones";
import { NewQuoteForm } from "./new-quote-form";
import { ReopenButton } from "./reopen-button";
import { ChargesManager } from "./charges-manager";
import { BillingPanel } from "./billing-panel";
import { chargeStage, computeBalance } from "@/server/billing";

type Props = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).number) };
}

const CHANNEL = { GREEN: "Verde", ORANGE: "Naranja", RED: "Rojo" } as const;

export default async function ExpedientePage({ params }: Props) {
  const number = decodeURIComponent((await params).number);
  const { organization, role } = await requireTenant();
  const editable = canEdit(role);
  const db = getDb();
  const s = await db.shipment.findUnique({
    where: { organizationId_number: { organizationId: organization.id, number } },
    include: {
      client: true,
      contact: true,
      origin: true,
      destination: true,
      carrier: true,
      agent: true,
      shipper: true,
      containers: true,
      customsEntries: true,
      quotes: {
        orderBy: { createdAt: "desc" },
        include: { versions: { orderBy: { versionNo: "desc" }, take: 1 } },
      },
      milestones: { orderBy: { sortOrder: "asc" }, include: { definition: { select: { phase: true } } } },
      requirements: { orderBy: { sortOrder: "asc" } },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { type: true, versions: { orderBy: { versionNo: "desc" }, take: 1 } },
      },
      charges: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "asc" } },
      statements: { orderBy: { issuedAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!s) notFound();

  const concepts = await db.chargeConcept.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });
  const chargeTotals = computeTotals(s.charges, organization.taxRate.toString());

  const templates = await db.quoteTemplate.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const suggested =
    templates.find((t) => t.direction === s.direction && t.mode === s.mode && t.includesFreight === s.includesFreight) ??
    templates.find((t) => t.direction === s.direction && (t.mode === s.mode || t.mode === null));

  const status = SHIPMENT_STATUS[s.status];
  const customs = s.customsEntries[0];
  const closed = ["LOST", "CANCELLED", "CLOSED"].includes(s.status);
  const containers = Object.entries(
    s.containers.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.equipment]: (acc[c.equipment] ?? 0) + 1 }), {}),
  )
    .map(([eq, n]) => `${n} × ${EQUIPMENT[eq as keyof typeof EQUIPMENT]}`)
    .join(", ");
  const place = (loc: { name: string; code: string } | null, text: string | null) => (loc ? `${loc.name} (${loc.code})` : text);

  return (
    <>
      <PageHeader
        eyebrow={`Expediente · ${DIRECTION[s.direction]} ${MODE[s.mode]}`}
        title={<Code>{s.number}</Code>}
        meta={
          <>
            <span className="font-medium text-ink">{s.client.legalName}</span>
            {s.contact && <span>{s.contact.name}</span>}
            <span>Abierto {formatDate(s.createdAt)}</span>
            {s.clientReference && <span>Ref. cliente {s.clientReference}</span>}
          </>
        }
        aside={
          <>
            <Badge tone={status.tone}>{status.label}</Badge>
            {editable && s.status === "LOST" && <ReopenButton shipmentId={s.id} number={s.number} />}
            {editable && (
              <Link href={`/expedientes/${s.number}/editar`} className={buttonClass("secondary")}>
                Editar datos
              </Link>
            )}
          </>
        }
      />

      <Section title="Cotizaciones" description="Todas las versiones que se enviaron al cliente para este expediente.">
        <div className="space-y-3">
          {s.quotes.length > 0 && (
            <Panel>
              <ul className="divide-y divide-rule">
                {s.quotes.map((q) => {
                  const v = q.versions[0];
                  const totals = (v?.totals ?? {}) as Totals;
                  return (
                    <li key={q.id}>
                      <Link href={`/cotizaciones/${q.number}`} className="press flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-paper/50">
                        <Code className="font-medium text-navy">{q.number}</Code>
                        <span className="text-sm text-ink-3">versión {q.currentVersionNo}{v?.status === "DRAFT" ? " (borrador)" : ""}</span>
                        <span className="tnum ml-auto text-sm text-ink">
                          {Object.entries(totals)
                            .map(([cur, t]) => formatMoney(t.total, cur))
                            .join(" + ") || "—"}
                        </span>
                        <Badge tone={QUOTE_STATUS[q.status].tone}>{QUOTE_STATUS[q.status].label}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
          {s.quotes.length === 0 && <Empty title="Aún no hay cotización">Cuando tengas la tarifa del agente, créala desde una plantilla.</Empty>}
          {editable && !closed && (
            <NewQuoteForm
              shipmentId={s.id}
              templates={templates.map((t) => ({ value: t.id, label: t.name }))}
              suggestedId={suggested?.id}
            />
          )}
        </div>
      </Section>

      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <Section title="Hitos" description="Al marcar un hito con su fecha, el estado avanza y queda en el historial.">
          <Milestones
            number={s.number}
            editable={editable}
            items={s.milestones.map((m) => ({
              id: m.id,
              name: m.name,
              clientLabel: m.clientLabel,
              clientVisible: m.clientVisible,
              notifyClient: m.notifyClient,
              status: m.status,
              completedAt: m.completedAt ? formatDate(m.completedAt) : null,
              note: m.note,
              phase: m.definition?.phase ?? (m.sortOrder < 0 ? "QUOTING" : "OPERATION"),
            }))}
          />
        </Section>

        <div>
          <Section title="Datos del expediente">
            <Facts
              items={[
                { label: "Incoterm", value: s.incoterm },
                { label: "Origen", value: place(s.origin, s.pickupAddress) },
                { label: "Destino", value: place(s.destination, s.deliveryAddress) },
                { label: s.mode === "AIR" ? "Aerolínea" : "Naviera", value: s.carrier?.name },
                { label: "Agente de carga", value: s.agent?.name },
                { label: "BL / HBL", value: s.hblNumber, mono: true },
                { label: "MBL", value: s.mblNumber, mono: true },
                { label: "Booking", value: s.bookingNumber, mono: true },
                { label: "Nave / viaje", value: [s.vessel, s.voyage].filter(Boolean).join(" · ") },
                { label: "ETD", value: s.etd ? formatDate(s.etd) : null },
                { label: "ETA", value: s.eta ? formatDate(s.eta) : null },
                { label: "Mercadería", value: s.commodity },
                { label: "Bultos", value: s.packages ? `${s.packages} ${s.packageType ?? ""}`.trim() : null },
                { label: "Peso", value: formatWeight(s.grossWeightKg) },
                { label: "Volumen", value: formatVolume(s.volumeCbm) },
                { label: "Contenedores", value: containers },
                { label: "DAM", value: customs?.declarationNumber, mono: true },
                { label: "Canal", value: customs?.channel ? CHANNEL[customs.channel] : null },
              ]}
            />
            {s.internalNotes && <p className="mt-3 whitespace-pre-line text-sm text-ink-2">{s.internalNotes}</p>}
          </Section>

          <Section title="Documentos">
            {s.documents.length === 0 ? (
              <Empty title="Sin documentos todavía" />
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

          {s.requirements.length > 0 && (
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
          )}
        </div>
      </div>

      {(s.charges.length > 0 || s.status !== "QUOTING") && (
        <>
          <Section
            title="Cargos del expediente"
            description="Los de la cotización aceptada más los adicionales. Lo de origen, flete y destino va al aviso de llegada; aduanas, almacén y transporte, a la liquidación de aduanas."
          >
            <ChargesManager
              shipmentId={s.id}
              number={s.number}
              editable={editable && !closed}
              concepts={concepts.map((c) => ({
                id: c.id,
                name: c.name,
                group: c.group,
                taxTreatment: c.taxTreatment,
                defaultCurrency: c.defaultCurrency,
                defaultCost: c.defaultCost?.toString() ?? null,
                defaultPrice: c.defaultPrice?.toString() ?? null,
              }))}
              charges={s.charges.map((c) => ({
                id: c.id,
                description: c.description,
                group: c.group,
                taxTreatment: c.taxTreatment,
                quantity: c.quantity.toString(),
                currency: c.currency,
                unitCost: c.unitCost.toString(),
                unitPrice: c.unitPrice.toString(),
                totalCost: c.totalCost.toString(),
                totalPrice: c.totalPrice.toString(),
                source: c.source,
                stage: chargeStage(c.group),
              }))}
            />
            {s.charges.length > 0 && (
              <div className="mt-3">
                <TotalsBox totals={chargeTotals} taxRate={organization.taxRate} />
              </div>
            )}
          </Section>

          <Section title="Cobranza" description="Depósitos del cliente, saldo y documentos que se le envían (aviso de llegada y liquidaciones).">
            <BillingPanel
              shipmentId={s.id}
              number={s.number}
              editable={editable}
              hasCharges={s.charges.length > 0}
              balance={computeBalance(chargeTotals, s.payments)}
              payments={s.payments.map((p) => ({
                id: p.id,
                paidAt: formatDate(p.paidAt),
                amount: p.amount.toString(),
                currency: p.currency,
                detail: [p.bank, p.reference ? `op. ${p.reference}` : null, p.notes].filter(Boolean).join(" · ") || "Depósito",
                kind: p.kind,
              }))}
              statements={s.statements.map((st) => ({
                id: st.id,
                number: st.number,
                type: st.type,
                issuedAt: formatDate(st.issuedAt),
                status: st.status,
                total: Object.entries(st.totals as Totals)
                  .map(([cur, t]) => formatMoney(t.total, cur))
                  .join(" + "),
              }))}
            />
          </Section>
        </>
      )}

      <Section title="Historial">
        {s.events.length === 0 ? (
          <Empty title="Sin movimientos" />
        ) : (
          <Panel>
            <ul className="divide-y divide-rule text-sm">
              {s.events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-2.5">
                  <span className="tnum w-28 shrink-0 text-xs text-ink-3">{formatDateTime(e.createdAt)}</span>
                  <span className="min-w-0 flex-1 text-ink">
                    {e.title}
                    {e.body && <span className="text-ink-3"> · {e.body}</span>}
                  </span>
                  {e.visibility === "CLIENT" && <Badge tone="info">Visible al cliente</Badge>}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <p className="mt-2 text-xs text-ink-3">
          Usa <Code>{s.number}</Code> en el asunto de tus correos con el cliente y el agente para encontrar todo rápido.{" "}
          {s.quotes[0] && <TextLink href={`/cotizaciones/${s.quotes[0].number}`}>Ir a la cotización</TextLink>}
        </p>
      </Section>
    </>
  );
}
