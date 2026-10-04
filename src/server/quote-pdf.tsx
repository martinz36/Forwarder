import { renderToBuffer } from "@react-pdf/renderer";
import type { Db } from "@/server/db";
import { QuotePdf, type QuotePdfLine } from "@/components/pdf/quote-pdf";
import { DIRECTION, EQUIPMENT, GROUPS, MODE, TAX } from "@/lib/labels";
import { formatDate, formatMoney, formatVolume, formatWeight } from "@/lib/format";
import { describeLine } from "@/lib/pricing/display";
import type { Totals } from "@/lib/pricing/totals";

/** Genera el PDF de una versión de cotización (la última si no se indica). null si no existe. */
export async function renderQuotePdf(db: Db, organizationId: string, number: string, versionNo?: number) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const quote = await db.quote.findUnique({
    where: { organizationId_number: { organizationId, number } },
    include: {
      client: true,
      contact: true,
      shipment: { select: { number: true } },
      versions: {
        where: versionNo ? { versionNo } : {},
        orderBy: { versionNo: "desc" },
        take: 1,
        include: { lines: { orderBy: { sortOrder: "asc" } }, equipment: true, origin: true, destination: true, carrier: true },
      },
    },
  });
  const v = quote?.versions[0];
  if (!quote || !v) return null;

  const toLine = (l: (typeof v.lines)[number]): QuotePdfLine => {
    const shown = describeLine(l);
    return {
      description: l.description,
      group: l.group,
      sectionLabel: GROUPS.find((g) => g.group === l.group)?.label ?? "Otros",
      taxLabel: TAX[l.taxTreatment],
      isTaxed: l.taxTreatment === "TAXED",
      quantity: shown.quantity,
      basisLabel: "",
      unitPrice: shown.unitPrice,
      total: shown.total,
      isOptional: l.isOptional,
    };
  };
  const main = v.lines.filter((l) => !l.isOptional);
  const place = (loc: { name: string; code: string } | null, text: string | null) => (loc ? `${loc.name} (${loc.code})` : text);
  const facts = [
    { label: "Servicio", value: `${DIRECTION[v.direction]} · ${MODE[v.mode]}` },
    { label: "Incoterm", value: v.incoterm },
    { label: "Origen", value: place(v.origin, v.originText) },
    { label: "Destino", value: place(v.destination, v.destinationText) },
    { label: v.mode === "AIR" ? "Aerolínea" : "Naviera", value: v.carrier?.name },
    { label: "Tránsito", value: v.transitTime },
    { label: "Frecuencia", value: v.frequency },
    { label: "Ruta", value: v.routing },
    { label: "Mercadería", value: v.commodity },
    { label: "Bultos", value: v.packages ? `${v.packages} ${v.packageType ?? ""}`.trim() : v.packageType },
    { label: "Peso", value: formatWeight(v.grossWeightKg) },
    { label: "Volumen", value: formatVolume(v.volumeCbm) },
    { label: "Contenedores", value: v.equipment.map((e) => `${e.quantity} × ${EQUIPMENT[e.equipment]}`).join(", ") },
    { label: "Forma de pago", value: v.paymentTerms },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  const buffer = await renderToBuffer(
    <QuotePdf
      d={{
        draft: v.status === "DRAFT",
        company: {
          name: org.name,
          legalName: org.legalName,
          taxId: org.taxId,
          address: org.address,
          phone: org.phone,
          email: org.email,
          website: org.website,
        },
        number: quote.number,
        versionNo: v.versionNo,
        issuedAt: formatDate(v.sentAt ?? v.createdAt),
        validUntil: v.validUntil ? formatDate(v.validUntil) : null,
        expediente: quote.shipment?.number ?? quote.reference,
        client: {
          legalName: quote.client.legalName,
          taxId: quote.client.taxId,
          taxIdType: quote.client.taxIdType,
          contact: quote.contact?.name ?? null,
          email: quote.contact?.email ?? quote.client.email,
          phone: quote.contact?.phone ?? quote.client.phone,
        },
        facts,
        sections: GROUPS.map((g) => ({ label: g.label, lines: main.filter((l) => l.group === g.group).map(toLine) })).filter((x) => x.lines.length),
        optional: v.lines.filter((l) => l.isOptional).map(toLine),
        totals: (v.totals ?? {}) as Totals,
        taxRate: org.taxRate.toString(),
        notes: v.notes,
        terms: v.terms ?? org.quoteTerms,
        formatMoney,
      }}
    />,
  );
  return { buffer, filename: `${quote.number}-v${v.versionNo}.pdf` };
}
