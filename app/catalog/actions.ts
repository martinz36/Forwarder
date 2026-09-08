"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { z } from "zod";

const conceptSchema = z.object({
  name: z.string().min(1, "El nombre del concepto es obligatorio."),
  defaultCurrency: z.enum(["USD", "PEN"]).default("USD"),
  defaultPrice: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0.").optional(),
  isTaxable: z.boolean().default(true),
});

export async function createConceptAction(data: z.infer<typeof conceptSchema>) {
  const validated = conceptSchema.parse(data);
  const trimmedName = validated.name.trim();

  const existing = await prisma.conceptCatalog.findUnique({
    where: { name: trimmedName },
  });

  if (existing) {
    return existing;
  }

  const created = await prisma.conceptCatalog.create({
    data: {
      name: trimmedName,
      defaultCurrency: validated.defaultCurrency,
      defaultPrice: validated.defaultPrice ?? 0,
      isTaxable: validated.isTaxable,
    },
  });

  revalidatePath("/catalog");
  return created;
}

export async function updateConceptAction(id: string, data: z.infer<typeof conceptSchema>) {
  const validated = conceptSchema.parse(data);
  const trimmedName = validated.name.trim();

  const existing = await prisma.conceptCatalog.findFirst({
    where: {
      name: trimmedName,
      NOT: { id },
    },
  });

  if (existing) {
    return existing;
  }

  const updated = await prisma.conceptCatalog.update({
    where: { id },
    data: {
      name: trimmedName,
      defaultCurrency: validated.defaultCurrency,
      defaultPrice: validated.defaultPrice ?? 0,
      isTaxable: validated.isTaxable,
    },
  });

  revalidatePath("/catalog");
  return updated;
}

export async function deleteConceptAction(id: string) {
  await prisma.conceptCatalog.delete({
    where: { id },
  });

  revalidatePath("/catalog");
}
