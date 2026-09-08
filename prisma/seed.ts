import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultConcepts = [
  { name: "EXW CHARGES (Gastos de Origen)", category: "GASTOS_ORIGEN", defaultCurrency: "USD", defaultPrice: 200.0, isTaxable: false },
  { name: "OCEAN FREIGHT TON/M3 (Flete Marítimo)", category: "FLETE_INTERNACIONAL", defaultCurrency: "USD", defaultPrice: 264.0, isTaxable: false },
  { name: "AIR FREIGHT (Flete Aéreo)", category: "FLETE_INTERNACIONAL", defaultCurrency: "USD", defaultPrice: 450.0, isTaxable: false },
  { name: "SEGURO DE CARGA (Opcional)", category: "SEGURO", defaultCurrency: "USD", defaultPrice: 110.0, isTaxable: false },
  { name: "Despacho Aduanero (Comisión Agente)", category: "GASTOS_LOCALES", defaultCurrency: "USD", defaultPrice: 200.0, isTaxable: true },
  { name: "Visto Bueno (V.B.)", category: "GASTOS_LOCALES", defaultCurrency: "USD", defaultPrice: 150.0, isTaxable: true },
  { name: "Handling / Gastos Administrativos", category: "GASTOS_LOCALES", defaultCurrency: "USD", defaultPrice: 80.0, isTaxable: true },
  { name: "Almacenaje Temporal / Depósito", category: "GASTOS_LOCALES", defaultCurrency: "USD", defaultPrice: 350.0, isTaxable: true },
  { name: "Transporte Local / Carga Interna", category: "GASTOS_LOCALES", defaultCurrency: "PEN", defaultPrice: 850.0, isTaxable: true },
  { name: "Precinto de Seguridad", category: "GASTOS_LOCALES", defaultCurrency: "USD", defaultPrice: 25.0, isTaxable: true },
  { name: "Emisión de BL / HBL", category: "GASTOS_LOCALES", defaultCurrency: "USD", defaultPrice: 60.0, isTaxable: true },
];

async function main() {
  console.log("Seeding default concepts into ConceptCatalog...");
  for (const concept of defaultConcepts) {
    await prisma.conceptCatalog.upsert({
      where: { name: concept.name },
      update: {
        category: concept.category,
        defaultCurrency: concept.defaultCurrency,
        defaultPrice: concept.defaultPrice,
        isTaxable: concept.isTaxable,
      },
      create: concept,
    });
  }
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
