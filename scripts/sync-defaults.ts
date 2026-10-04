/**
 * Instala en todas las empresas los catálogos por defecto que falten (hitos, tipos de documento,
 * conceptos, plantillas) y agrega a los expedientes en curso los hitos operativos nuevos.
 * No modifica ni borra nada existente. Se puede correr las veces que haga falta.
 *
 *   npm run defaults:sync
 */
import "dotenv/config";
import { createDb } from "../src/server/db";
import { installOrganization } from "../src/server/setup/organization";
import { planOperation } from "../src/server/expedientes";

const db = createDb(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
try {
  const orgs = await db.organization.findMany();
  for (const org of orgs) {
    await db.$transaction(
      async (tx) => {
        await installOrganization(tx, { slug: org.slug, name: org.name, legalName: org.legalName });
        const active = await tx.shipment.findMany({
          where: { organizationId: org.id, status: { notIn: ["QUOTING", "LOST", "CANCELLED", "CLOSED"] } },
          select: { id: true, number: true },
        });
        for (const s of active) await planOperation(tx, org.id, s.id, null);
        console.log(`${org.name}: catálogos al día · ${active.length} expediente(s) en curso revisados`);
      },
      { timeout: 120_000 },
    );
  }
} finally {
  await db.$disconnect();
}
