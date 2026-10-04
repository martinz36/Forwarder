/**
 * Importa al modelo v2 los datos del sistema anterior (esquema `public`):
 * empresa, clientes (con contacto y notas), catálogo de conceptos, puertos, terceros
 * y cotizaciones con sus ítems. Las cotizaciones aceptadas con operación pasan a ser
 * embarques, con sus cargos, pagos y documentos reales.
 *
 * No modifica ni borra nada del sistema anterior: solo lee.
 * Todo corre en una transacción: o se importa completo o no se importa nada.
 *
 *   npm run legacy:import -- --dry-run      simula y muestra el resultado, sin guardar
 *   npm run legacy:import                   importa
 *
 * Se puede correr más de una vez: lo ya importado se salta (tabla LegacyIdMap).
 */
import "dotenv/config";
import pg from "pg";
import Decimal from "decimal.js";
import { createDb, parseDatabaseUrl } from "../src/server/db";
import type { Prisma } from "../src/generated/prisma/client";
import type { ChargeBasis, Currency, EquipmentType, TaxTreatment } from "../src/generated/prisma/enums";
import { installOrganization, normalizeName } from "../src/server/setup/organization";
import { DEFAULT_CONCEPTS, DEFAULT_QUOTE_TERMS } from "../src/server/setup/defaults";
import { MARIVAN_QUOTE_TERMS, MARIVAN_QUOTE_VALIDITY_DAYS } from "./legacy/marivan";
import { computeTotals } from "../src/lib/pricing/totals";
import { round2 } from "../src/lib/pricing/quantity";
import { bumpSequence, nextShipmentNumber, sequenceKeys } from "../src/server/sequences";
import { applicableMilestones, applicableRequirements, milestonesDoneUpTo } from "../src/server/shipments/plan";
import {
  isMockDocument,
  isNoContainers,
  mapCategory,
  mapCustomsChannel,
  mapDocumentTypeCode,
  mapOperationStatus,
  mapPartnerType,
  mapTaxIdType,
  parseContainers,
  parseDate,
  parseIncoterm,
  parsePackages,
  parseServiceMode,
  parseVolumeCbm,
  parseWeightKg,
} from "./legacy/parse";

type Row = Record<string, any>;
type Tx = Prisma.TransactionClient;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const ORG_SLUG = [...args].find((a) => a.startsWith("--org="))?.slice(6) ?? "marivan";

class DryRunRollback extends Error {}

// ───────────────────────────── Lectura del sistema anterior ─────────────────────────────

async function readLegacy(url: string) {
  const client = new pg.Client({ connectionString: parseDatabaseUrl(url).connectionString });
  await client.connect();
  const table = async (name: string, orderBy = `"id"`): Promise<Row[]> => {
    const exists = await client.query(`select to_regclass($1) as t`, [`public."${name}"`]);
    if (!exists.rows[0]?.t) return [];
    return (await client.query(`select * from public."${name}" order by ${orderBy}`)).rows;
  };
  try {
    return {
      company: (await table("CompanyProfile"))[0] as Row | undefined,
      clients: await table("Client", `"createdAt", "id"`),
      clientNotes: await table("ClientNote", `"createdAt", "id"`),
      ports: await table("Port"),
      partners: await table("Partner"),
      concepts: await table("ConceptCatalog"),
      expedients: await table("Expedient", `"createdAt", "id"`),
      quotations: await table("Quotation", `"createdAt", "id"`),
      items: await table("QuotationItem", `"createdAt", "id"`),
      operations: await table("Operation", `"createdAt", "id"`),
      charges: await table("OperationCharge", `"createdAt", "id"`),
      payments: await table("PaymentRecord", `"paymentDate", "id"`),
      documents: await table("Document", `"uploadedAt", "id"`),
    };
  } finally {
    await client.end();
  }
}

type Legacy = Awaited<ReturnType<typeof readLegacy>>;

// ───────────────────────────── Utilidades ─────────────────────────────

const report = {
  created: new Map<string, number>(),
  skipped: new Map<string, number>(),
  warnings: [] as string[],
};
const count = (bucket: Map<string, number>, key: string) => bucket.set(key, (bucket.get(key) ?? 0) + 1);
const warn = (msg: string) => report.warnings.push(msg);

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const money = (v: unknown) => round2(new Decimal(Number(v ?? 0) || 0));
const taxFrom = (isTaxable: unknown): TaxTreatment => (isTaxable ? "TAXED" : "REIMBURSABLE");
const currencyFrom = (v: unknown): Currency => (String(v ?? "").toUpperCase() === "PEN" ? "PEN" : "USD");

class IdMap {
  constructor(private tx: Tx, private organizationId: string, private known: Map<string, string>) {}
  static async load(tx: Tx, organizationId: string) {
    const rows = await tx.legacyIdMap.findMany({ where: { organizationId } });
    return new IdMap(tx, organizationId, new Map(rows.map((r) => [`${r.entity}:${r.legacyId}`, r.newId])));
  }
  get(entity: string, legacyId: string | null | undefined) {
    return legacyId ? this.known.get(`${entity}:${legacyId}`) : undefined;
  }
  async set(entity: string, legacyId: string, newId: string) {
    this.known.set(`${entity}:${legacyId}`, newId);
    await this.tx.legacyIdMap.create({ data: { entity, legacyId, newId, organizationId: this.organizationId } });
  }
}

// ───────────────────────────── Importación ─────────────────────────────

async function importAll(tx: Tx, legacy: Legacy) {
  const company = legacy.company;
  const installed = await installOrganization(tx, {
    slug: ORG_SLUG,
    name: text(company?.tradeName) ?? "Marivan Logistics",
    legalName: text(company?.legalName) ?? "Marivan Logistics SAC",
    taxId: text(company?.ruc),
    address: text(company?.address),
    phone: text(company?.phone),
    email: text(company?.email),
    website: text(company?.website),
  });
  // Condiciones y validez propias de Marivan, salvo que ya se hayan cambiado desde configuración.
  const defaultTerms = DEFAULT_QUOTE_TERMS.replaceAll("{empresa}", installed.legalName.toUpperCase());
  const org = await tx.organization.update({
    where: { id: installed.id },
    data: {
      ...(!installed.quoteTerms || installed.quoteTerms === defaultTerms ? { quoteTerms: MARIVAN_QUOTE_TERMS } : {}),
      ...(installed.quoteValidityDays === 15 ? { quoteValidityDays: MARIVAN_QUOTE_VALIDITY_DAYS } : {}),
    },
  });
  const organizationId = org.id;
  const ids = await IdMap.load(tx, organizationId);

  // Catálogos del sistema nuevo, para enlazar.
  const docTypes = await tx.documentType.findMany({ where: { organizationId } });
  const docTypeByCode = new Map(docTypes.map((d) => [d.code, d]));
  const milestoneDefs = await tx.milestoneDefinition.findMany({ where: { organizationId } });

  // ── Puertos → Location
  for (const p of legacy.ports) {
    if (ids.get("Port", p.id)) { count(report.skipped, "Puertos"); continue; }
    const code = String(p.code).trim().toUpperCase();
    const location =
      (await tx.location.findUnique({ where: { organizationId_code: { organizationId, code } } })) ??
      (await tx.location.create({
        data: {
          organizationId,
          code,
          name: text(p.name) ?? code,
          country: (text(p.country) ?? (code.length === 5 ? code.slice(0, 2) : "")).toUpperCase(),
          type: /^[A-Z]{3}$/.test(code) ? "AIRPORT" : "SEAPORT",
        },
      }));
    await ids.set("Port", p.id, location.id);
    count(report.created, "Puertos");
  }

  // ── Terceros → Partner
  for (const p of legacy.partners) {
    if (ids.get("Partner", p.id)) { count(report.skipped, "Terceros"); continue; }
    const type = mapPartnerType(p.type);
    const name = String(p.name).trim();
    const partner = await tx.partner.upsert({
      where: { organizationId_type_name: { organizationId, type, name } },
      create: { organizationId, type, name },
      update: {},
    });
    await ids.set("Partner", p.id, partner.id);
    count(report.created, "Terceros");
  }

  async function partnerFromText(type: "CARRIER" | "AIRLINE" | "SHIPPER", name: string | null, clientId?: string) {
    if (!name || name.length > 80) return null;
    const p = await tx.partner.upsert({
      where: { organizationId_type_name: { organizationId, type, name } },
      create: { organizationId, type, name, clientId },
      update: {},
    });
    return p.id;
  }

  // ── Catálogo de conceptos
  const aliasToCode = new Map<string, string>();
  for (const c of DEFAULT_CONCEPTS) for (const n of [c.name, ...(c.aliases ?? [])]) aliasToCode.set(normalizeName(n), c.code);

  async function conceptsByName() {
    const all = await tx.chargeConcept.findMany({ where: { organizationId } });
    const map = new Map<string, (typeof all)[number]>();
    for (const c of all) {
      map.set(normalizeName(c.name), c);
      if (c.code) for (const d of DEFAULT_CONCEPTS.filter((d) => d.code === c.code)) for (const a of d.aliases ?? []) map.set(normalizeName(a), c);
    }
    return map;
  }

  const FLAT_BASES: ChargeBasis[] = ["PER_SHIPMENT", "PER_DOCUMENT", "MANUAL"];
  let conceptIndex = await conceptsByName();
  for (const c of legacy.concepts) {
    if (ids.get("ConceptCatalog", c.id)) { count(report.skipped, "Conceptos"); continue; }
    const name = String(c.name).trim();
    const existing = conceptIndex.get(normalizeName(name));
    const perWmName = /TON\s*\/\s*M3|W\s*\/\s*M|CBM/i.test(name);
    const prices = { defaultCost: money(c.defaultCost).toString(), defaultPrice: money(c.defaultPrice).toString() };
    let conceptId: string;
    if (existing) {
      const priceFits = FLAT_BASES.includes(existing.defaultBasis) || (existing.defaultBasis === "PER_WM" && perWmName);
      if (!priceFits) warn(`Concepto "${name}": precio por defecto no importado porque ahora se cobra por ${existing.defaultBasis}. Cárgalo en un tarifario.`);
      await tx.chargeConcept.update({
        where: { id: existing.id },
        data: {
          taxTreatment: taxFrom(c.isTaxable),
          defaultCurrency: currencyFrom(c.defaultCurrency),
          ...(priceFits ? prices : {}),
        },
      });
      conceptId = existing.id;
    } else {
      const created = await tx.chargeConcept.create({
        data: {
          organizationId,
          name,
          group: mapCategory(c.category),
          taxTreatment: taxFrom(c.isTaxable),
          defaultBasis: perWmName ? "PER_WM" : "PER_SHIPMENT",
          defaultCurrency: currencyFrom(c.defaultCurrency),
          ...prices,
          sortOrder: 1000,
        },
      });
      conceptId = created.id;
    }
    await ids.set("ConceptCatalog", c.id, conceptId);
    count(report.created, "Conceptos");
  }
  conceptIndex = await conceptsByName();
  const conceptFor = (description: string) => conceptIndex.get(normalizeName(description));

  // ── Clientes, contacto principal y notas
  const primaryContact = new Map<string, string>();
  for (const c of legacy.clients) {
    if (ids.get("Client", c.id)) { count(report.skipped, "Clientes"); continue; }
    const taxIdType = mapTaxIdType(c.documentType);
    const taxId = text(c.documentNumber);
    const existing = taxId
      ? await tx.client.findUnique({ where: { organizationId_taxIdType_taxId: { organizationId, taxIdType, taxId } } })
      : null;
    const client =
      existing ??
      (await tx.client.create({
        data: {
          organizationId,
          taxIdType,
          taxId,
          legalName: String(c.businessName ?? c.name ?? "Sin nombre").trim(),
          status: String(c.status).toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          email: text(c.email),
          phone: text(c.phone),
          address: text(c.address),
          createdAt: c.createdAt,
        },
      }));
    await ids.set("Client", c.id, client.id);
    count(report.created, "Clientes");

    if (!existing && (text(c.contactName) || text(c.email) || text(c.phone))) {
      const contact = await tx.contact.create({
        data: {
          organizationId,
          clientId: client.id,
          name: text(c.contactName) ?? client.legalName,
          email: text(c.email),
          phone: text(c.phone),
          isPrimary: true,
        },
      });
      primaryContact.set(client.id, contact.id);
      count(report.created, "Contactos");
    }
  }

  for (const n of legacy.clientNotes) {
    const clientId = ids.get("Client", n.clientId);
    if (!clientId || ids.get("ClientNote", n.id)) { count(report.skipped, "Notas"); continue; }
    const event = await tx.activityEvent.create({
      data: { organizationId, clientId, type: "note", title: "Nota", body: n.content, createdAt: n.createdAt },
    });
    await ids.set("ClientNote", n.id, event.id);
    count(report.created, "Notas");
  }

  // ── Cotizaciones (versión 1) y embarques
  const expedientById = new Map(legacy.expedients.map((e) => [e.id, e]));
  const itemsByQuote = Map.groupBy(legacy.items, (i) => i.quotationId as string);
  const operationByQuote = new Map(legacy.operations.map((o) => [o.quotationId, o]));
  const chargesByOp = Map.groupBy(legacy.charges, (c) => c.operationId as string);
  const paymentsByOp = Map.groupBy(legacy.payments, (p) => p.operationId as string);
  const docsByOp = Map.groupBy(legacy.documents, (d) => d.operationId as string);

  for (const q of legacy.quotations) {
    if (ids.get("Quotation", q.id)) { count(report.skipped, "Cotizaciones"); continue; }
    const clientId = ids.get("Client", q.clientId);
    if (!clientId) { warn(`Cotización ${q.code}: su cliente no existe, se omite.`); continue; }

    const expedient = q.expedientId ? expedientById.get(q.expedientId) : undefined;
    const operation = operationByQuote.get(q.id);
    const { direction, mode } = parseServiceMode({
      modality: q.modality,
      loadType: q.loadType,
      containersCount: q.containersCount,
      transportMode: expedient?.transportMode,
    });

    const notes: string[] = [];
    const keep = (label: string, value: unknown) => { const t = text(value); if (t) notes.push(`${label}: ${t}`); };

    const etd = parseDate(q.etd);
    if (!etd) keep("ETD", q.etd);
    const eta = parseDate(q.eta);
    if (!eta) keep("ETA", q.eta);
    const grossWeightKg = parseWeightKg(q.grossWeight);
    if (grossWeightKg === null) keep("Peso", q.grossWeight);
    const volumeCbm = parseVolumeCbm(q.volume);
    if (volumeCbm === null) keep("Volumen", q.volume);
    const { packages, packageType } = parsePackages(q.packagesCount);
    const containers = parseContainers(q.containersCount);
    if (!containers && !isNoContainers(q.containersCount)) keep("Contenedores", q.containersCount);
    const commodity = text(q.mercaderia) ?? text(q.cargoType);
    if (text(q.mercaderia) && text(q.cargoType) && q.mercaderia.trim() !== q.cargoType.trim()) keep("Tipo de carga", q.cargoType);
    if (!operation) keep("BL", q.blNro);
    const incoterm = parseIncoterm(q.incoterm);
    if (!incoterm) keep("Incoterm", q.incoterm);

    const carrierType = mode === "AIR" ? "AIRLINE" : "CARRIER";
    const carrierId = ids.get("Partner", q.carrierId) ?? (await partnerFromText(carrierType, text(q.shippingLine)));
    const shipperId = ids.get("Partner", q.shipperId) ?? (await partnerFromText("SHIPPER", text(q.shipper), clientId));

    const items = itemsByQuote.get(q.id) ?? [];
    const lines = items.map((it, i) => {
      const quantity = new Decimal(Number(it.quantity) || 1);
      const unitCost = new Decimal(Number(it.unitCost) || 0);
      const unitPrice = new Decimal(Number(it.unitPrice) || 0);
      const concept = conceptFor(String(it.description));
      return {
        organizationId,
        conceptId: concept?.id,
        description: String(it.description).trim(),
        // El sistema anterior solo tenía 4 categorías; el concepto trae la sección precisa.
        group: concept?.group ?? mapCategory(it.category),
        taxTreatment: taxFrom(it.isTaxable),
        basis: "MANUAL" as ChargeBasis,
        quantity: quantity.toString(),
        currency: currencyFrom(it.currency),
        unitCost: unitCost.toString(),
        unitPrice: unitPrice.toString(),
        totalCost: round2(unitCost.mul(quantity)).toString(),
        totalPrice: round2(unitPrice.mul(quantity)).toString(),
        sortOrder: i * 10,
      };
    });

    // Servicios incluidos según las líneas cotizadas (sin líneas, se asume flete + aduana).
    const groups = new Set(lines.map((l) => l.group));
    const scope = {
      direction,
      mode,
      includesFreight: lines.length === 0 || groups.has("FREIGHT") || groups.has("ORIGIN"),
      // Marivan es agencia de aduanas: las importaciones llevan despacho salvo que se indique lo contrario.
      includesCustoms: true,
      includesInsurance: groups.has("INSURANCE"),
      includesInland: groups.has("INLAND_TRANSPORT"),
    };

    const totals = computeTotals(lines, org.taxRate.toString());
    for (const [currency, legacyTotal] of [["USD", q.totalUsd], ["PEN", q.totalPen]] as const) {
      const recomputed = Number(totals[currency]?.total ?? 0);
      if (Math.abs(recomputed - Number(legacyTotal ?? 0)) > 0.01) {
        warn(`Cotización ${q.code}: el total ${currency} guardado era ${Number(legacyTotal ?? 0).toFixed(2)} y recalculado da ${recomputed.toFixed(2)}. Revisar.`);
      }
    }

    const status = String(q.status).toUpperCase() as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
    const wasSent = status !== "DRAFT";
    const quote = await tx.quote.create({
      data: {
        organizationId,
        number: await uniqueQuoteNumber(tx, organizationId, String(q.code)),
        clientId,
        contactId: primaryContact.get(clientId),
        reference: text(expedient?.externalCode) ?? text(expedient?.code),
        status,
        createdAt: q.createdAt,
        versions: {
          create: {
            organizationId,
            versionNo: 1,
            status,
            ...scope,
            incoterm,
            originId: ids.get("Port", q.polId),
            destinationId: ids.get("Port", q.podId),
            originText: text(q.origin),
            destinationText: text(q.destination),
            carrierId,
            shipperId,
            routing: text(q.shippingType),
            frequency: text(q.frequency),
            transitTime: text(q.transitTime),
            etd,
            eta,
            commodity,
            packages,
            packageType,
            grossWeightKg,
            volumeCbm,
            validUntil: q.validUntil,
            paymentTerms: text(q.formaPago),
            notes: [text(q.notes), ...notes].filter(Boolean).join("\n") || null,
            internalNotes: text(expedient?.notes) ? `Notas del expediente: ${expedient!.notes}` : null,
            terms: wasSent ? org.quoteTerms : null,
            totals: totals as Prisma.InputJsonValue,
            respondedAt: status === "ACCEPTED" ? operation?.createdAt ?? q.updatedAt : null,
            createdAt: q.createdAt,
            lines: { create: lines },
            equipment: containers ? { create: containers.map((c) => ({ organizationId, ...c })) } : undefined,
          },
        },
      },
      include: { versions: { include: { lines: true } } },
    });
    const version = quote.versions[0]!;
    if (status === "ACCEPTED") {
      await tx.quote.update({ where: { id: quote.id }, data: { acceptedVersionId: version.id } });
    }
    await ids.set("Quotation", q.id, quote.id);
    count(report.created, "Cotizaciones");
    if (notes.length) warn(`Cotización ${quote.number}: ${notes.length} dato(s) de texto libre quedaron en observaciones.`);
    await tx.activityEvent.create({
      data: { organizationId, clientId, quoteId: quote.id, type: "quote.imported", title: "Importada del sistema anterior", createdAt: q.createdAt },
    });

    // Cotización aceptada con operación → embarque
    if (!operation) {
      if (status === "ACCEPTED") warn(`Cotización ${quote.number}: aceptada pero sin operación; no se crea embarque.`);
      continue;
    }
    const shipmentStatus = mapOperationStatus(operation.status);
    const legacyNumber = text(expedient?.externalCode);
    const number =
      legacyNumber && /^[MALT]-\d{4}-\d+$/.test(legacyNumber) &&
      !(await tx.shipment.findUnique({ where: { organizationId_number: { organizationId, number: legacyNumber } } }))
        ? legacyNumber
        : await nextShipmentNumber(tx, organizationId, mode, operation.createdAt);

    const shipment = await tx.shipment.create({
      data: {
        organizationId,
        number,
        clientId,
        contactId: primaryContact.get(clientId),
        status: shipmentStatus,
        statusChangedAt: operation.updatedAt,
        ...scope,
        incoterm: parseIncoterm(operation.incoterm) ?? incoterm,
        originId: version.originId,
        destinationId: version.destinationId,
        shipperId,
        carrierId,
        hblNumber: text(operation.blNumber) ?? text(q.blNro),
        etd: operation.etd ?? etd,
        eta: operation.eta ?? eta,
        commodity,
        packages,
        packageType,
        grossWeightKg,
        volumeCbm,
        internalNotes: text(expedient?.notes),
        createdAt: operation.createdAt,
        containers: containers
          ? { create: containers.flatMap((c) => Array.from({ length: c.quantity }, () => ({ organizationId, equipment: c.equipment as EquipmentType }))) }
          : undefined,
      },
    });
    await tx.quote.update({ where: { id: quote.id }, data: { shipmentId: shipment.id } });
    await ids.set("Operation", operation.id, shipment.id);
    count(report.created, "Embarques");

    const channel = mapCustomsChannel(operation.customsChannel);
    if (channel) {
      await tx.customsEntry.create({ data: { organizationId, shipmentId: shipment.id, channel } });
    }

    // Cargos: los de la cotización toman sección y concepto de su línea; los extra se conservan como extra.
    const unmatchedLines = [...version.lines];
    for (const [i, ch] of (chargesByOp.get(operation.id) ?? []).entries()) {
      const idx = ch.isExtraCharge
        ? -1
        : unmatchedLines.findIndex((l) => normalizeName(l.description) === normalizeName(String(ch.description)) && l.currency === currencyFrom(ch.currency));
      const quoteLine = idx >= 0 ? unmatchedLines.splice(idx, 1)[0] : undefined;
      const concept = quoteLine?.conceptId ? undefined : conceptFor(String(ch.description));
      await tx.shipmentCharge.create({
        data: {
          organizationId,
          shipmentId: shipment.id,
          conceptId: quoteLine?.conceptId ?? concept?.id,
          quoteLineId: quoteLine?.id,
          source: ch.isExtraCharge ? "EXTRA" : "QUOTE",
          description: String(ch.description).trim(),
          group: quoteLine?.group ?? concept?.group ?? mapCategory(ch.category),
          taxTreatment: taxFrom(ch.isTaxable),
          basis: "MANUAL",
          quantity: String(Number(ch.quantity) || 1),
          currency: currencyFrom(ch.currency),
          unitCost: String(Number(ch.unitCost) || 0),
          unitPrice: String(Number(ch.unitPrice) || 0),
          totalCost: money(ch.totalCost).toString(),
          totalPrice: money(ch.totalPrice).toString(),
          requiresAdvance: Boolean(ch.isAdvance),
          sortOrder: i * 10,
          createdAt: ch.createdAt,
        },
      });
      count(report.created, "Cargos de embarque");
    }

    for (const p of paymentsByOp.get(operation.id) ?? []) {
      await tx.payment.create({
        data: {
          organizationId,
          clientId,
          shipmentId: shipment.id,
          kind: /anticip|adelant|provisi/i.test(String(p.concept)) ? "ADVANCE" : "SETTLEMENT",
          amount: money(p.amount).toString(),
          currency: currencyFrom(p.currency),
          bank: text(p.bank),
          reference: text(p.operationNumber),
          paidAt: p.paymentDate,
          notes: text(p.concept),
          createdAt: p.createdAt,
        },
      });
      count(report.created, "Pagos");
    }

    const importedDocs = new Map<string, string>(); // tipo → documento
    for (const d of docsByOp.get(operation.id) ?? []) {
      const url = String(d.fileUrl);
      if (isMockDocument(url)) { count(report.skipped, "Documentos simulados (factura/recibo de prueba)"); continue; }
      const fromClient = String(d.uploadedBy).toUpperCase() === "CLIENT";
      const type = docTypeByCode.get(mapDocumentTypeCode(d.documentType, d.name));
      const document = await tx.document.create({
        data: {
          organizationId,
          clientId,
          shipmentId: shipment.id,
          typeId: type?.id,
          title: String(d.name).trim(),
          visibility: fromClient || d.isPublic ? "CLIENT" : "INTERNAL",
          status: fromClient || !d.isDraft ? "FINAL" : "DRAFT",
          uploadedSide: fromClient ? "CLIENT" : "STAFF",
          createdAt: d.uploadedAt,
          versions: {
            create: {
              organizationId,
              versionNo: 1,
              externalUrl: url,
              fileName: String(d.name).trim(),
              uploadedSide: fromClient ? "CLIENT" : "STAFF",
              note: "Importado del sistema anterior",
              createdAt: d.uploadedAt,
            },
          },
        },
      });
      if (type) importedDocs.set(type.id, document.id);
      count(report.created, "Documentos");
    }

    const defs = applicableMilestones(milestoneDefs, scope);
    const done = milestonesDoneUpTo(defs, shipmentStatus);
    // Si ya tenía canal asignado, ese hito también está cumplido.
    if (channel) for (const m of defs) if (m.code.endsWith("_CHANNEL")) done.add(m.id);
    await tx.shipmentMilestone.createMany({
      data: defs.map((m) => ({
        organizationId,
        shipmentId: shipment.id,
        definitionId: m.id,
        name: m.name,
        clientLabel: m.clientLabel,
        setsStatus: m.setsStatus,
        clientVisible: m.clientVisible,
        notifyClient: m.notifyClient,
        sortOrder: m.sortOrder,
        status: m.code === "ORDER_CONFIRMED" || done.has(m.id) ? "DONE" : "PENDING",
        completedAt: m.code === "ORDER_CONFIRMED" ? operation.createdAt : null,
        note: done.has(m.id) && m.code !== "ORDER_CONFIRMED" ? "Sin fecha (importado)" : null,
      })),
    });

    await tx.documentRequirement.createMany({
      data: applicableRequirements(docTypes, scope).map((t) => ({
        organizationId,
        shipmentId: shipment.id,
        typeId: t.id,
        documentId: importedDocs.get(t.id),
        title: t.name,
        responsible: t.defaultResponsible,
        status: importedDocs.has(t.id) ? "RECEIVED" : "PENDING",
        sortOrder: t.sortOrder,
      })),
    });

    await tx.activityEvent.create({
      data: {
        organizationId,
        clientId,
        shipmentId: shipment.id,
        quoteId: quote.id,
        type: "shipment.imported",
        title: "Importado del sistema anterior",
        body: `Estado anterior: ${operation.status}`,
        createdAt: operation.createdAt,
      },
    });
  }

  // ── Correlativos: continuar después de los números ya usados
  for (const q of legacy.quotations) {
    const m = String(q.code).match(/^COT-(\d{4})-(\d+)$/);
    if (m) await bumpSequence(tx, organizationId, sequenceKeys.quote(Number(m[1])), Number(m[2]));
  }
  for (const e of legacy.expedients) {
    const m = String(e.externalCode ?? "").match(/^([MALT])-(\d{4})-(\d+)$/);
    if (m) await bumpSequence(tx, organizationId, sequenceKeys.shipment(Number(m[2])), Number(m[3]));
  }

  return org;
}

async function uniqueQuoteNumber(tx: Tx, organizationId: string, code: string) {
  const taken = await tx.quote.findUnique({ where: { organizationId_number: { organizationId, number: code } } });
  if (!taken) return code;
  warn(`El número ${code} ya existía en el sistema nuevo; se importó como ${code}-A.`);
  return `${code}-A`;
}

/** Resumen legible de lo importado (se muestra también en la simulación). */
async function printPreview(tx: Tx, organizationId: string) {
  const quotes = await tx.quote.findMany({
    where: { organizationId },
    orderBy: { number: "asc" },
    include: { client: true, versions: { include: { lines: { orderBy: { sortOrder: "asc" } } } } },
  });
  console.log("\nCotizaciones:");
  for (const q of quotes) {
    const v = q.versions[0]!;
    const totals = Object.entries((v.totals ?? {}) as Record<string, { total: string; margin: string }>)
      .map(([cur, t]) => `${cur} ${t.total} (margen ${t.margin})`)
      .join(" · ");
    console.log(`  ${q.number} · ${q.client.legalName} · ${q.status} · ${v.mode} ${v.incoterm ?? ""} · ${totals}`);
    for (const l of v.lines) console.log(`      - ${l.description} [${l.group}, ${l.taxTreatment}] ${l.currency} ${l.totalPrice}`);
    if (v.notes) console.log(`      Observaciones: ${v.notes.replace(/\n/g, " / ")}`);
  }
  const shipments = await tx.shipment.findMany({
    where: { organizationId },
    include: { client: true, milestones: { orderBy: { sortOrder: "asc" } }, documents: true, charges: true },
  });
  console.log("\nEmbarques:");
  for (const s of shipments) {
    const done = s.milestones.filter((m) => m.status === "DONE").map((m) => m.name);
    const next = s.milestones.find((m) => m.status === "PENDING")?.name ?? "—";
    console.log(`  ${s.number} · ${s.client.legalName} · estado ${s.status} · BL ${s.hblNumber ?? "—"}`);
    console.log(`      Hitos cumplidos: ${done.join(" → ") || "—"}`);
    console.log(`      Siguiente hito: ${next}`);
    console.log(`      Cargos: ${s.charges.length} · Documentos: ${s.documents.map((d) => `${d.title} (${d.visibility}/${d.status})`).join(", ") || "—"}`);
  }
}

// ───────────────────────────── Main ─────────────────────────────

async function main() {
  const legacyUrl = process.env.LEGACY_DATABASE_URL ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!legacyUrl) throw new Error("Falta LEGACY_DATABASE_URL");
  const db = createDb(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

  const legacy = await readLegacy(legacyUrl);
  console.log("Sistema anterior:");
  console.table({
    Clientes: legacy.clients.length,
    Cotizaciones: legacy.quotations.length,
    "Ítems de cotización": legacy.items.length,
    Operaciones: legacy.operations.length,
    Documentos: legacy.documents.length,
    Pagos: legacy.payments.length,
    Conceptos: legacy.concepts.length,
  });

  try {
    await db.$transaction(
      async (tx) => {
        const org = await importAll(tx, legacy);
        await printPreview(tx, org.id);
        if (DRY_RUN) throw new DryRunRollback();
      },
      { timeout: 10 * 60_000, maxWait: 60_000 },
    );
  } catch (err) {
    if (!(err instanceof DryRunRollback)) throw err;
  } finally {
    await db.$disconnect();
  }

  console.log(DRY_RUN ? "\nSIMULACIÓN (no se guardó nada):" : "\nImportación completada:");
  console.table(Object.fromEntries(report.created));
  if (report.skipped.size) {
    console.log("Omitidos:");
    console.table(Object.fromEntries(report.skipped));
  }
  if (report.warnings.length) {
    console.log("Avisos:");
    for (const w of report.warnings) console.log(` - ${w}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
