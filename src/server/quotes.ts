import type { Db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ChargeBasis, ChargeGroup, Currency, TaxTreatment } from "@/generated/prisma/enums";
import { nextQuoteNumber } from "@/server/sequences";
import { buildQuoteLines, type RateCandidate } from "@/lib/pricing/resolve";
import { lineAmount } from "@/lib/pricing/quantity";
import { computeTotals } from "@/lib/pricing/totals";
import { isExpired } from "@/lib/quote-status";
import { formatDate } from "@/lib/format";

export { isExpired };
import { DomainError, planOperation, setMilestone, type Actor } from "@/server/expedientes";

type Tx = Prisma.TransactionClient;

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

async function rateCandidates(tx: Tx, organizationId: string): Promise<RateCandidate[]> {
  const lines = await tx.rateCardLine.findMany({
    where: { organizationId, rateCard: { status: "ACTIVE" } },
    include: { rateCard: true },
  });
  return lines.map((l) => ({ ...l, card: l.rateCard }));
}

/** Crea la cotización (v1 en borrador) de un expediente, precargada con la plantilla y las tarifas. */
export async function createQuote(db: Db, actor: Actor, shipmentId: string, templateId: string | null) {
  return db.$transaction(async (tx) => {
    const org = await tx.organization.findUniqueOrThrow({ where: { id: actor.organizationId } });
    const shipment = await tx.shipment.findFirst({
      where: { id: shipmentId, organizationId: actor.organizationId },
      include: { containers: true },
    });
    if (!shipment) throw new DomainError("El expediente no existe.");
    if (["LOST", "CANCELLED", "CLOSED"].includes(shipment.status)) throw new DomainError("El expediente ya está cerrado.");

    const template = templateId
      ? await tx.quoteTemplate.findFirst({
          where: { id: templateId, organizationId: actor.organizationId },
          include: { lines: { orderBy: { sortOrder: "asc" }, include: { concept: true } } },
        })
      : null;

    const containers = Object.entries(
      shipment.containers.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.equipment]: (acc[c.equipment] ?? 0) + 1 }), {}),
    ).map(([equipment, quantity]) => ({ equipment: equipment as (typeof shipment.containers)[number]["equipment"], quantity }));

    const incoterm = shipment.incoterm ?? template?.incoterm ?? null;
    const draft = template
      ? buildQuoteLines(
          template.lines.map((l) => ({
            concept: l.concept,
            basis: l.basis,
            quantity: l.quantity,
            isOptional: l.isOptional,
            incoterms: l.incoterms,
            sortOrder: l.sortOrder,
          })),
          await rateCandidates(tx, actor.organizationId),
          {
            clientId: shipment.clientId,
            direction: shipment.direction,
            mode: shipment.mode,
            originId: shipment.originId,
            destinationId: shipment.destinationId,
            carrierId: shipment.carrierId,
            incoterm,
            date: new Date(),
            cargo: {
              grossWeightKg: shipment.grossWeightKg,
              volumeCbm: shipment.volumeCbm,
              chargeableWeightKg: shipment.chargeableWeightKg,
              packages: shipment.packages,
              containers,
              cifValue: shipment.cargoValue,
              fobValue: shipment.cargoValue,
            },
          },
          org.defaultMarkupPct.toString(),
        )
      : [];

    const lines = draft.map(({ warnings: _w, priceSource: _p, ...l }) => ({ ...l, organizationId: actor.organizationId }));
    const number = await nextQuoteNumber(tx, actor.organizationId);
    const quote = await tx.quote.create({
      data: {
        organizationId: actor.organizationId,
        number,
        clientId: shipment.clientId,
        contactId: shipment.contactId,
        templateId: template?.id,
        shipmentId: shipment.id,
        reference: shipment.number,
        ownerId: actor.userId,
        versions: {
          create: {
            organizationId: actor.organizationId,
            versionNo: 1,
            direction: shipment.direction,
            mode: shipment.mode,
            incoterm,
            includesFreight: template?.includesFreight ?? shipment.includesFreight,
            includesCustoms: template?.includesCustoms ?? shipment.includesCustoms,
            includesInsurance: template?.includesInsurance ?? shipment.includesInsurance,
            includesInland: template?.includesInland ?? shipment.includesInland,
            originId: shipment.originId,
            destinationId: shipment.destinationId,
            originText: shipment.pickupAddress,
            destinationText: shipment.deliveryAddress,
            carrierId: shipment.carrierId,
            commodity: shipment.commodity,
            packages: shipment.packages,
            packageType: shipment.packageType,
            grossWeightKg: shipment.grossWeightKg,
            volumeCbm: shipment.volumeCbm,
            cargoValue: shipment.cargoValue,
            validUntil: addDays(new Date(), template?.validityDays ?? org.quoteValidityDays),
            notes: template?.defaultNotes ?? null,
            totals: computeTotals(lines, org.taxRate.toString()) as Prisma.InputJsonValue,
            createdById: actor.userId,
            lines: { create: lines },
            equipment: { create: containers.map((c) => ({ ...c, organizationId: actor.organizationId })) },
          },
        },
      },
    });

    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: shipment.clientId,
        shipmentId: shipment.id,
        quoteId: quote.id,
        type: "quote.created",
        title: `Cotización ${number} creada`,
        actorUserId: actor.userId,
      },
    });
    return quote;
  });
}

export interface DraftLineInput {
  conceptId?: string | null;
  description: string;
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  basis: ChargeBasis;
  quantity: number;
  currency: Currency;
  unitCost: number;
  unitPrice: number;
  minPrice?: number | null;
  isOptional: boolean;
  notes?: string | null;
}

export interface DraftInput {
  incoterm?: string | null;
  validUntil?: Date | null;
  originId?: string | null;
  originText?: string | null;
  destinationId?: string | null;
  destinationText?: string | null;
  carrierId?: string | null;
  routing?: string | null;
  frequency?: string | null;
  transitTime?: string | null;
  commodity?: string | null;
  packages?: number | null;
  packageType?: string | null;
  grossWeightKg?: number | null;
  volumeCbm?: number | null;
  cargoValue?: number | null;
  paymentTerms?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  lines: DraftLineInput[];
}

/** Guarda la versión en borrador. Los totales siempre se recalculan en el servidor. */
export async function saveDraft(db: Db, actor: Actor, versionId: string, input: DraftInput) {
  return db.$transaction(async (tx) => {
    const version = await tx.quoteVersion.findFirst({ where: { id: versionId, organizationId: actor.organizationId } });
    if (!version) throw new DomainError("La cotización no existe.");
    if (version.status !== "DRAFT") throw new DomainError("Solo se puede editar un borrador. Crea una nueva versión.");
    const org = await tx.organization.findUniqueOrThrow({ where: { id: actor.organizationId } });

    const lines = input.lines
      .filter((l) => l.description.trim())
      .map((l, i) => ({
        organizationId: actor.organizationId,
        versionId,
        conceptId: l.conceptId || null,
        description: l.description.trim(),
        group: l.group,
        taxTreatment: l.taxTreatment,
        basis: l.basis,
        quantity: String(l.quantity),
        currency: l.currency,
        unitCost: String(l.unitCost),
        unitPrice: String(l.unitPrice),
        minPrice: l.minPrice ? String(l.minPrice) : null,
        totalCost: lineAmount({ quantity: l.quantity, unitAmount: l.unitCost }).toFixed(2),
        totalPrice: lineAmount({ quantity: l.quantity, unitAmount: l.unitPrice, minAmount: l.minPrice }).toFixed(2),
        isOptional: l.isOptional,
        notes: l.notes?.trim() || null,
        sortOrder: i * 10,
      }));

    const { lines: _lines, ...header } = input;
    const clean = Object.fromEntries(
      Object.entries(header).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]),
    ) as Omit<DraftInput, "lines">;

    await tx.quoteLine.deleteMany({ where: { versionId } });
    await tx.quoteLine.createMany({ data: lines });
    await tx.quoteVersion.update({
      where: { id: versionId },
      data: { ...clean, totals: computeTotals(lines, org.taxRate.toString()) as Prisma.InputJsonValue },
    });
  });
}

/** Marca la versión como enviada: queda congelada con las condiciones vigentes. */
export async function sendVersion(db: Db, actor: Actor, versionId: string) {
  const result = await db.$transaction(async (tx) => {
    const version = await tx.quoteVersion.findFirst({
      where: { id: versionId, organizationId: actor.organizationId },
      include: { quote: { include: { template: true } }, lines: { select: { id: true } } },
    });
    if (!version) throw new DomainError("La cotización no existe.");
    if (version.status !== "DRAFT") throw new DomainError("Esta versión ya fue enviada.");
    if (version.lines.length === 0) throw new DomainError("Agrega al menos un concepto antes de enviar.");
    const org = await tx.organization.findUniqueOrThrow({ where: { id: actor.organizationId } });
    const now = new Date();

    await tx.quoteVersion.updateMany({
      where: { quoteId: version.quoteId, status: "SENT", id: { not: version.id } },
      data: { status: "SUPERSEDED" },
    });
    await tx.quoteVersion.update({
      where: { id: version.id },
      data: {
        status: "SENT",
        sentAt: now,
        sentById: actor.userId,
        validUntil: version.validUntil ?? addDays(now, org.quoteValidityDays),
        terms: version.quote.template?.terms ?? org.quoteTerms,
      },
    });
    await tx.quote.update({ where: { id: version.quoteId }, data: { status: "SENT", currentVersionNo: version.versionNo } });
    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: version.quote.clientId,
        shipmentId: version.quote.shipmentId,
        quoteId: version.quoteId,
        type: "quote.sent",
        title: `Cotización ${version.quote.number} enviada (versión ${version.versionNo})`,
        visibility: "CLIENT",
        actorUserId: actor.userId,
      },
    });
    if (!version.quote.shipmentId) return null;
    // Si se envía la cotización, los pasos comerciales previos (tarifa del agente) ya ocurrieron.
    await tx.shipmentMilestone.updateMany({
      where: {
        shipmentId: version.quote.shipmentId,
        status: "PENDING",
        definition: { phase: "QUOTING", code: { notIn: ["QUOTE_SENT"] } },
      },
      data: { status: "DONE", note: "Marcado al enviar la cotización", completedById: actor.userId },
    });
    return tx.shipmentMilestone.findFirst({
      where: { shipmentId: version.quote.shipmentId, status: "PENDING", definition: { code: "QUOTE_SENT" } },
      select: { id: true },
    });
  });
  if (result) await setMilestone(db, actor, result.id, { status: "DONE" });
}

/** Nueva versión a partir de la última (para ajustar precios después de enviada). */
export async function createNewVersion(db: Db, actor: Actor, quoteId: string) {
  return db.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id: quoteId, organizationId: actor.organizationId },
      include: { versions: { orderBy: { versionNo: "desc" }, take: 1, include: { lines: true, equipment: true } } },
    });
    const last = quote?.versions[0];
    if (!quote || !last) throw new DomainError("La cotización no existe.");
    if (last.status === "DRAFT") return last;
    if (quote.status === "ACCEPTED") throw new DomainError("La cotización ya fue aceptada; los cambios van como cargos del expediente.");

    const {
      id: _id, versionNo, status: _s, sentAt: _sa, sentById: _sb, viewedAt: _va, respondedAt: _ra,
      respondedByContactId: _rc, responseNote: _rn, createdAt: _ca, updatedAt: _ua, lines, equipment, terms: _t, totals,
      ...rest
    } = last;
    const version = await tx.quoteVersion.create({
      data: {
        ...rest,
        totals: (totals ?? undefined) as Prisma.InputJsonValue | undefined,
        versionNo: versionNo + 1,
        validUntil: addDays(new Date(), (await tx.organization.findUniqueOrThrow({ where: { id: actor.organizationId } })).quoteValidityDays),
        status: "DRAFT",
        createdById: actor.userId,
        lines: { create: lines.map(({ id: _l, versionId: _v, ...l }) => l) },
        equipment: { create: equipment.map(({ id: _e, versionId: _v, ...e }) => e) },
      },
    });
    await tx.quote.update({ where: { id: quote.id }, data: { currentVersionNo: version.versionNo } });
    return version;
  });
}

/** Registra la respuesta del cliente. Si acepta, el expediente pasa a operación con sus cargos e hitos. */
export async function respondQuote(
  db: Db,
  actor: Actor,
  quoteId: string,
  decision: "ACCEPTED" | "REJECTED",
  note?: string | null,
  opts: { rateReconfirmed?: boolean } = {},
) {
  return db.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id: quoteId, organizationId: actor.organizationId },
      include: { versions: { where: { status: "SENT" }, orderBy: { versionNo: "desc" }, take: 1, include: { lines: true } } },
    });
    const version = quote?.versions[0];
    if (!quote || !version) throw new DomainError("Primero marca la cotización como enviada.");
    // Condiciones: si se acepta fuera de vigencia, la tarifa se reconfirma con el agente.
    const lateAcceptance = decision === "ACCEPTED" && isExpired(version.validUntil);
    if (lateAcceptance && !opts.rateReconfirmed) {
      throw new DomainError(
        `La cotización venció el ${formatDate(version.validUntil)}. Reconfirma la tarifa con el agente y marca «Tarifa reconfirmada» para aceptarla (o crea una nueva versión).`,
      );
    }
    const now = new Date();

    await tx.quoteVersion.update({
      where: { id: version.id },
      data: { status: decision, respondedAt: now, responseNote: note?.trim() || null },
    });
    await tx.quote.update({
      where: { id: quote.id },
      data: {
        status: decision,
        ...(decision === "ACCEPTED" ? { acceptedVersionId: version.id } : { lostReason: note?.trim() || null }),
      },
    });

    if (quote.shipmentId) {
      const shipment = await tx.shipment.findUniqueOrThrow({ where: { id: quote.shipmentId } });
      if (decision === "ACCEPTED") {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: "CONFIRMED",
            statusChangedAt: now,
            direction: version.direction,
            mode: version.mode,
            incoterm: version.incoterm,
            includesFreight: version.includesFreight,
            includesCustoms: version.includesCustoms,
            includesInsurance: version.includesInsurance,
            includesInland: version.includesInland,
            originId: version.originId ?? shipment.originId,
            destinationId: version.destinationId ?? shipment.destinationId,
            carrierId: version.carrierId ?? shipment.carrierId,
            commodity: version.commodity ?? shipment.commodity,
            packages: version.packages ?? shipment.packages,
            packageType: version.packageType ?? shipment.packageType,
            grossWeightKg: version.grossWeightKg ?? shipment.grossWeightKg,
            volumeCbm: version.volumeCbm ?? shipment.volumeCbm,
            cargoValue: version.cargoValue ?? shipment.cargoValue,
          },
        });
        await tx.client.updateMany({ where: { id: shipment.clientId, status: "PROSPECT" }, data: { status: "ACTIVE" } });
        // Cargos del expediente = líneas aceptadas (las opcionales no, salvo que luego se agreguen).
        const conceptIds = version.lines.map((l) => l.conceptId).filter((id): id is string => Boolean(id));
        const conceptBilling = new Map(
          (await tx.chargeConcept.findMany({ where: { id: { in: conceptIds } }, select: { id: true, billedIn: true } })).map((c) => [c.id, c.billedIn]),
        );
        await tx.shipmentCharge.createMany({
          data: version.lines
            .filter((l) => !l.isOptional)
            .map((l) => ({
              organizationId: actor.organizationId,
              shipmentId: shipment.id,
              conceptId: l.conceptId,
              quoteLineId: l.id,
              billedIn: l.conceptId ? (conceptBilling.get(l.conceptId) ?? null) : null,
              providerId: l.providerId,
              source: "QUOTE" as const,
              description: l.description,
              group: l.group,
              taxTreatment: l.taxTreatment,
              basis: l.basis,
              quantity: l.quantity,
              currency: l.currency,
              unitCost: l.unitCost,
              unitPrice: l.unitPrice,
              totalCost: l.totalCost,
              totalPrice: l.totalPrice,
              sortOrder: l.sortOrder,
              createdById: actor.userId,
            })),
        });
        await planOperation(tx, actor.organizationId, shipment.id, actor.userId);
      } else {
        const open = await tx.quote.count({
          where: { shipmentId: shipment.id, id: { not: quote.id }, status: { in: ["DRAFT", "SENT", "ACCEPTED"] } },
        });
        if (open === 0 && shipment.status === "QUOTING") {
          await tx.shipment.update({ where: { id: shipment.id }, data: { status: "LOST", statusChangedAt: now } });
        }
      }
    }

    await tx.activityEvent.create({
      data: {
        organizationId: actor.organizationId,
        clientId: quote.clientId,
        shipmentId: quote.shipmentId,
        quoteId: quote.id,
        type: decision === "ACCEPTED" ? "quote.accepted" : "quote.rejected",
        title: `Cotización ${quote.number} ${decision === "ACCEPTED" ? "aceptada" : "no aceptada"}`,
        body: [note?.trim(), lateAcceptance ? "Aceptada fuera de vigencia: tarifa reconfirmada con el agente" : null].filter(Boolean).join(" · ") || null,
        visibility: "CLIENT",
        actorUserId: actor.userId,
      },
    });
  });
}
