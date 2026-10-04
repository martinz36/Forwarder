import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireTenant } from "@/server/tenant";
import { getDb } from "@/server/db";
import { canEdit } from "@/server/action-utils";
import { Code, PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/catalog";
import { QuoteEditor } from "./quote-editor";

export const metadata: Metadata = { title: "Editar cotización" };

const s = (v: { toString(): string } | string | number | null | undefined) => (v === null || v === undefined ? "" : v.toString());

export default async function EditQuotePage({ params }: { params: Promise<{ number: string }> }) {
  const number = decodeURIComponent((await params).number);
  const { organization, role } = await requireTenant();
  if (!canEdit(role)) redirect(`/cotizaciones/${number}`);
  const db = getDb();

  const quote = await db.quote.findUnique({
    where: { organizationId_number: { organizationId: organization.id, number } },
    include: {
      client: true,
      shipment: { select: { number: true } },
      versions: { orderBy: { versionNo: "desc" }, take: 1, include: { lines: { orderBy: { sortOrder: "asc" } }, equipment: true } },
    },
  });
  if (!quote) notFound();
  const v = quote.versions[0];
  if (!v) notFound();
  if (v.status !== "DRAFT") redirect(`/cotizaciones/${number}`);

  const [concepts, locations, carriers] = await Promise.all([
    db.chargeConcept.findMany({ where: { organizationId: organization.id, isActive: true }, orderBy: [{ group: "asc" }, { sortOrder: "asc" }] }),
    db.location.findMany({ where: { organizationId: organization.id }, orderBy: [{ country: "asc" }, { name: "asc" }] }),
    db.partner.findMany({
      where: { organizationId: organization.id, isActive: true, type: { in: ["CARRIER", "AIRLINE", "COLOADER"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            {quote.client.legalName}
            {quote.shipment && (
              <>
                {" · expediente "}
                <Link href={`/expedientes/${quote.shipment.number}`} className="underline underline-offset-2">
                  {quote.shipment.number}
                </Link>
              </>
            )}
          </>
        }
        title={
          <>
            <Code>{quote.number}</Code> <span className="text-ink-3">· versión {v.versionNo} (borrador)</span>
          </>
        }
      />
      <div className="mt-6">
        <QuoteEditor
          versionId={v.id}
          number={quote.number}
          taxRate={organization.taxRate.toString()}
          markupPct={organization.defaultMarkupPct.toString()}
          containers={v.equipment.map((e) => ({ equipment: e.equipment, quantity: e.quantity }))}
          concepts={concepts.map((c) => ({
            id: c.id,
            name: c.name,
            group: c.group,
            taxTreatment: c.taxTreatment,
            defaultBasis: c.defaultBasis,
            defaultCurrency: c.defaultCurrency,
            defaultCost: c.defaultCost?.toString() ?? null,
            defaultPrice: c.defaultPrice?.toString() ?? null,
            defaultMinPrice: c.defaultMinPrice?.toString() ?? null,
          }))}
          locations={locations.map((l) => ({ value: l.id, label: `${l.name} (${l.code})` }))}
          carriers={carriers.map((p) => ({ value: p.id, label: p.name }))}
          header={{
            incoterm: s(v.incoterm),
            validUntil: toDateInput(v.validUntil),
            originId: s(v.originId),
            originText: s(v.originText),
            destinationId: s(v.destinationId),
            destinationText: s(v.destinationText),
            carrierId: s(v.carrierId),
            routing: s(v.routing),
            frequency: s(v.frequency),
            transitTime: s(v.transitTime),
            commodity: s(v.commodity),
            packages: s(v.packages),
            packageType: s(v.packageType),
            grossWeightKg: s(v.grossWeightKg),
            volumeCbm: s(v.volumeCbm),
            cargoValue: s(v.cargoValue),
            paymentTerms: s(v.paymentTerms),
            notes: s(v.notes),
            internalNotes: s(v.internalNotes),
          }}
          lines={v.lines.map((l) => ({
            key: l.id,
            conceptId: l.conceptId,
            description: l.description,
            group: l.group,
            taxTreatment: l.taxTreatment,
            basis: l.basis,
            quantity: s(l.quantity),
            currency: l.currency,
            unitCost: s(l.unitCost),
            unitPrice: s(l.unitPrice),
            minPrice: s(l.minPrice),
            isOptional: l.isOptional,
            notes: s(l.notes),
          }))}
        />
      </div>
    </>
  );
}
