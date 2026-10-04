// Crea una empresa de demostración con los catálogos por defecto (para desarrollo local).
// En producción las empresas se crean desde el registro; Marivan se crea con el importador.
import "dotenv/config";
import { createDb } from "../src/server/db";
import { setupOrganization } from "../src/server/setup/organization";

const db = createDb(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

setupOrganization(db, {
  slug: "demo",
  name: "Agencia Demo",
  legalName: "Agencia Demo SAC",
  taxId: "20000000001",
})
  .then((org) => console.log(`Empresa lista: ${org.name} (${org.id})`))
  .finally(() => db.$disconnect());
