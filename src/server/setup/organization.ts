import type { Db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_CONCEPTS,
  DEFAULT_DOCUMENT_TYPES,
  DEFAULT_LOCATIONS,
  DEFAULT_MILESTONES,
  DEFAULT_QUOTE_TERMS,
  DEFAULT_TEMPLATES,
} from "./defaults";

export interface NewOrganizationInput {
  slug: string;
  name: string;
  legalName: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

/** Normaliza un nombre para comparar conceptos ("Visto Bueno (V.B.)" ≈ "visto bueno (v.b.)"). */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Crea la empresa (o la actualiza si ya existe) e instala catálogos por defecto:
 * conceptos, plantillas de cotización, hitos y tipos de documento.
 * Es idempotente: se puede correr varias veces sin duplicar nada.
 */
export async function setupOrganization(db: Db, input: NewOrganizationInput) {
  return db.$transaction((tx) => installOrganization(tx, input), { timeout: 120_000 });
}

/** Igual que setupOrganization, pero dentro de una transacción existente. */
export async function installOrganization(tx: Prisma.TransactionClient, input: NewOrganizationInput) {
  const org = await tx.organization.upsert({
    where: { slug: input.slug },
    create: {
      ...input,
      quoteTerms: DEFAULT_QUOTE_TERMS.replaceAll("{empresa}", input.legalName.toUpperCase()),
    },
    update: {},
  });
  const organizationId = org.id;

  await installConcepts(tx, organizationId);
  await installTemplates(tx, organizationId);
  await installMilestones(tx, organizationId);
  await installDocumentTypes(tx, organizationId);
  await installLocations(tx, organizationId);

  return org;
}

async function installConcepts(tx: Prisma.TransactionClient, organizationId: string) {
  for (const [index, c] of DEFAULT_CONCEPTS.entries()) {
    await tx.chargeConcept.upsert({
      where: { organizationId_code: { organizationId, code: c.code } },
      create: {
        organizationId,
        code: c.code,
        name: c.name,
        group: c.group,
        taxTreatment: c.taxTreatment,
        defaultBasis: c.basis,
        defaultCurrency: c.currency ?? "USD",
        sortOrder: index * 10,
      },
      update: {},
    });
  }
}

async function installTemplates(tx: Prisma.TransactionClient, organizationId: string) {
  const concepts = await tx.chargeConcept.findMany({ where: { organizationId, code: { not: null } }, select: { id: true, code: true } });
  const byCode = new Map(concepts.map((c) => [c.code!, c.id]));

  for (const [index, t] of DEFAULT_TEMPLATES.entries()) {
    const exists = await tx.quoteTemplate.findUnique({ where: { organizationId_name: { organizationId, name: t.name } } });
    if (exists) continue;
    await tx.quoteTemplate.create({
      data: {
        organizationId,
        name: t.name,
        description: t.description,
        direction: t.direction,
        mode: t.mode,
        includesFreight: t.includesFreight,
        includesCustoms: t.includesCustoms,
        includesInsurance: t.includesInsurance ?? false,
        includesInland: t.includesInland ?? false,
        incoterm: t.incoterm,
        sortOrder: index * 10,
        lines: {
          create: t.lines.map((l, i) => {
            const conceptId = byCode.get(l.code);
            if (!conceptId) throw new Error(`Plantilla "${t.name}": falta el concepto ${l.code}`);
            return { organizationId, conceptId, basis: l.basis, isOptional: l.optional ?? false, incoterms: l.incoterms ?? [], sortOrder: i * 10 };
          }),
        },
      },
    });
  }
}

async function installMilestones(tx: Prisma.TransactionClient, organizationId: string) {
  // Los comerciales van antes de la orden con orden negativo; los operativos conservan 0, 10, 20…
  // Los que traen orden fijo se intercalan sin mover a los demás (ya instalados en empresas existentes).
  const quoting = DEFAULT_MILESTONES.filter((m) => m.phase === "QUOTING");
  const operation = DEFAULT_MILESTONES.filter((m) => m.phase !== "QUOTING" && m.sortOrder === undefined);
  const fixed = DEFAULT_MILESTONES.filter((m) => m.phase !== "QUOTING" && m.sortOrder !== undefined);
  const ordered = [
    ...quoting.map((m, i) => ({ m, sortOrder: (i - quoting.length) * 10 })),
    ...operation.map((m, i) => ({ m, sortOrder: i * 10 })),
    ...fixed.map((m) => ({ m, sortOrder: m.sortOrder! })),
  ];
  for (const { m, sortOrder } of ordered) {
    await tx.milestoneDefinition.upsert({
      where: { organizationId_code: { organizationId, code: m.code } },
      create: {
        organizationId,
        code: m.code,
        name: m.name,
        clientLabel: m.clientLabel,
        directions: m.directions,
        modes: m.modes ?? [],
        requiresFreight: m.requiresFreight ?? false,
        requiresCustoms: m.requiresCustoms ?? false,
        requiresInland: m.requiresInland ?? false,
        setsStatus: m.setsStatus,
        clientVisible: m.clientVisible ?? true,
        notifyClient: m.notifyClient ?? false,
        phase: m.phase ?? "OPERATION",
        sortOrder,
      },
      update: {},
    });
  }
}

async function installDocumentTypes(tx: Prisma.TransactionClient, organizationId: string) {
  for (const [index, d] of DEFAULT_DOCUMENT_TYPES.entries()) {
    await tx.documentType.upsert({
      where: { organizationId_code: { organizationId, code: d.code } },
      create: {
        organizationId,
        code: d.code,
        name: d.name,
        defaultVisibility: d.visibility,
        clientCanUpload: d.clientCanUpload ?? false,
        defaultResponsible: d.responsible ?? "STAFF",
        requiredForDirections: d.requiredForDirections ?? [],
        requiredForModes: d.requiredForModes ?? [],
        requiredWhenCustoms: d.requiredWhenCustoms ?? false,
        sortOrder: index * 10,
      },
      update: {},
    });
  }
}

async function installLocations(tx: Prisma.TransactionClient, organizationId: string) {
  await tx.location.createMany({
    data: DEFAULT_LOCATIONS.map((l) => ({ organizationId, ...l })),
    skipDuplicates: true,
  });
}
