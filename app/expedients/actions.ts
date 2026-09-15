"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export interface CreateExpedientInput {
  clientId: string;
  loadType?: "FCL" | "LCL" | "AÉREO" | "TERRESTRE";
  transportMode?: "AIR" | "FCL" | "LCL" | "TERRESTRE";
  customCode?: string;
  notes?: string;
}

function slugifyBusinessName(name: string): string {
  const cleanName = name
    .toUpperCase()
    .replace(/\b(S\.?A\.?C\.?|S\.?A\.?|E\.?I\.?R\.?L\.?|S\.?R\.?L\.?|INC|LLC|CORP|PERU|PERÚ)\b/gi, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim();

  const words = cleanName.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CLIENTE";

  const slugWords = words.slice(0, 2).join("-");
  return slugWords.slice(0, 18);
}

export async function createExpedientAction(input: CreateExpedientInput) {
  if (!input.clientId) {
    throw new Error("Debes seleccionar un cliente para abrir un expediente.");
  }

  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
    select: { businessName: true },
  });

  if (!client) {
    throw new Error("El cliente seleccionado no existe.");
  }

  const loadType = input.loadType || "FCL";
  const rawTransport = (input.transportMode || loadType).toUpperCase();
  
  let transportMode = "FCL";
  let prefix = "M";

  if (rawTransport.includes("AIR") || rawTransport.includes("AÉREO")) {
    transportMode = "AIR";
    prefix = "A";
  } else if (rawTransport.includes("LCL")) {
    transportMode = "LCL";
    prefix = "L";
  } else if (rawTransport.includes("TERRESTRE")) {
    transportMode = "TERRESTRE";
    prefix = "T";
  }

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear + 1, 0, 1);

  const countThisYear = await prisma.expedient.count({
    where: {
      createdAt: {
        gte: yearStart,
        lt: yearEnd,
      },
    },
  });

  const sequence = String(countThisYear + 1).padStart(4, "0");
  const externalCode = `${prefix}-${currentYear}-${sequence}`;

  let code = input.customCode?.trim();
  if (!code) {
    const totalCount = await prisma.expedient.count();
    const sequenceTotal = String(totalCount + 1).padStart(4, "0");
    const clientSlug = slugifyBusinessName(client.businessName);
    code = `EXP-${currentYear}-${clientSlug}-${loadType}-${sequenceTotal}`;
  }

  const expedient = await prisma.expedient.create({
    data: {
      code,
      externalCode,
      transportMode,
      clientId: input.clientId,
      loadType,
      notes: input.notes?.trim() || null,
      status: "OPEN",
    },
  });

  revalidatePath("/expedients");
  revalidatePath(`/clients/${input.clientId}`);
  redirect(`/expedients/${expedient.id}`);
}

export async function deleteExpedientAction(expedientId: string) {
  if (!expedientId) {
    throw new Error("ID de expediente no proporcionado.");
  }

  const expedient = await prisma.expedient.findUnique({
    where: { id: expedientId },
    include: {
      operations: true,
    },
  });

  if (!expedient) {
    throw new Error("El expediente especificado no existe.");
  }

  if (expedient.operations.length > 0) {
    throw new Error("No se puede eliminar un expediente que cuenta con operaciones en curso.");
  }

  await prisma.expedient.delete({
    where: { id: expedientId },
  });

  revalidatePath("/expedients");
  revalidatePath(`/clients/${expedient.clientId}`);
  return { success: true };
}

export async function ensureExpedientExternalCodesAction() {
  const missingExpedients = await prisma.expedient.findMany({
    where: { externalCode: null },
    orderBy: { createdAt: "asc" },
  });

  if (missingExpedients.length === 0) return;

  for (const exp of missingExpedients) {
    const year = new Date(exp.createdAt).getFullYear();
    const loadUpper = (exp.loadType || "FCL").toUpperCase();
    let prefix = "M";
    let mode = "FCL";

    if (loadUpper.includes("AIR") || loadUpper.includes("AÉREO")) {
      prefix = "A";
      mode = "AIR";
    } else if (loadUpper.includes("LCL")) {
      prefix = "L";
      mode = "LCL";
    }

    const yearCount = await prisma.expedient.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
        externalCode: { not: null },
      },
    });

    const seq = String(yearCount + 1).padStart(4, "0");
    const extCode = `${prefix}-${year}-${seq}`;

    await prisma.expedient.update({
      where: { id: exp.id },
      data: {
        externalCode: extCode,
        transportMode: mode,
      },
    });
  }
}
