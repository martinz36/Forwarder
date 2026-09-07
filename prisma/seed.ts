import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultConcepts = [
  { name: "Flete Internacional (FCL/LCL)", defaultCurrency: "USD", defaultPrice: 1200.0, isTaxable: true },
  { name: "Visto Bueno (V.B.)", defaultCurrency: "USD", defaultPrice: 150.0, isTaxable: true },
  { name: "Handling / Gastos Administrativos", defaultCurrency: "USD", defaultPrice: 80.0, isTaxable: true },
  { name: "Despacho Aduanero (Comisión Agente)", defaultCurrency: "USD", defaultPrice: 200.0, isTaxable: true },
  { name: "Almacenaje Temporal / Depósito", defaultCurrency: "USD", defaultPrice: 350.0, isTaxable: false },
  { name: "Transporte Local / Carga Interna", defaultCurrency: "PEN", defaultPrice: 850.0, isTaxable: true },
  { name: "Cuadrilla / Estiba y Desestiba", defaultCurrency: "PEN", defaultPrice: 250.0, isTaxable: false },
  { name: "Precinto de Seguridad / Candado", defaultCurrency: "USD", defaultPrice: 25.0, isTaxable: true },
  { name: "Emisión de BL / HBL", defaultCurrency: "USD", defaultPrice: 60.0, isTaxable: true },
];

async function main() {
  console.log("Seeding default concepts into ConceptCatalog...");
  for (const concept of defaultConcepts) {
    await prisma.conceptCatalog.upsert({
      where: { name: concept.name },
      update: {},
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
