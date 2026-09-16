"use server";

import { revalidatePath } from "next/cache";
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

// Collision-free external code generator (e.g. M-2026-0004, L-2026-0004, A-2026-0004)
async function generateNextExternalCode(prefix: string, year: number): Promise<string> {
  const allYearExpedients = await prisma.expedient.findMany({
    where: {
      externalCode: {
        not: null,
      },
    },
    select: { externalCode: true },
  });

  let maxSeq = 0;
  for (const exp of allYearExpedients) {
    if (exp.externalCode) {
      const parts = exp.externalCode.split("-");
      const lastPart = parts[parts.length - 1];
      const seqNum = parseInt(lastPart, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}-${year}-${String(nextSeq).padStart(4, "0")}`;

  while (await prisma.expedient.findUnique({ where: { externalCode: candidate } })) {
    nextSeq++;
    candidate = `${prefix}-${year}-${String(nextSeq).padStart(4, "0")}`;
  }

  return candidate;
}

// Collision-free internal code generator (e.g. EXP-2026-CLIENTE-FCL-0004)
async function generateNextInternalCode(clientSlug: string, loadType: string, year: number): Promise<string> {
  const allExpedients = await prisma.expedient.findMany({
    select: { code: true },
  });

  let maxSeq = 0;
  for (const exp of allExpedients) {
    const parts = exp.code.split("-");
    const lastPart = parts[parts.length - 1];
    const seqNum = parseInt(lastPart, 10);
    if (!isNaN(seqNum) && seqNum > maxSeq) {
      maxSeq = seqNum;
    }
  }

  let nextSeq = maxSeq + 1;
  let candidate = `EXP-${year}-${clientSlug}-${loadType}-${String(nextSeq).padStart(4, "0")}`;

  while (await prisma.expedient.findUnique({ where: { code: candidate } })) {
    nextSeq++;
    candidate = `EXP-${year}-${clientSlug}-${loadType}-${String(nextSeq).padStart(4, "0")}`;
  }

  return candidate;
}

export async function createExpedientAction(input: CreateExpedientInput) {
  try {
    if (!input.clientId) {
      return { success: false, error: "Debes seleccionar un cliente para abrir un expediente." };
    }

    const client = await prisma.client.findUnique({
      where: { id: input.clientId },
      select: { businessName: true },
    });

    if (!client) {
      return { success: false, error: "El cliente seleccionado no existe." };
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
    const externalCode = await generateNextExternalCode(prefix, currentYear);

    let code = input.customCode?.trim();
    if (!code) {
      const clientSlug = slugifyBusinessName(client.businessName);
      code = await generateNextInternalCode(clientSlug, loadType, currentYear);
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

    return { success: true, expedientId: expedient.id };
  } catch (err: any) {
    console.error("Error in createExpedientAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error inesperado al registrar el expediente.",
    };
  }
}

export async function deleteExpedientAction(expedientId: string) {
  try {
    if (!expedientId) {
      return { success: false, error: "ID de expediente no proporcionado." };
    }

    const expedient = await prisma.expedient.findUnique({
      where: { id: expedientId },
      include: {
        operations: true,
      },
    });

    if (!expedient) {
      return { success: false, error: "El expediente especificado no existe." };
    }

    if (expedient.operations.length > 0) {
      return { success: false, error: "No se puede eliminar un expediente que cuenta con operaciones activas en curso." };
    }

    await prisma.expedient.delete({
      where: { id: expedientId },
    });

    revalidatePath("/expedients");
    revalidatePath(`/clients/${expedient.clientId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteExpedientAction:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al eliminar el expediente.",
    };
  }
}

export async function ensureExpedientExternalCodesAction() {
  try {
    const missingExpedients = await prisma.expedient.findMany({
      where: { externalCode: null },
      orderBy: { createdAt: "asc" },
    });

    if (missingExpedients.length === 0) return { success: true };

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

      const extCode = await generateNextExternalCode(prefix, year);

      await prisma.expedient.update({
        where: { id: exp.id },
        data: {
          externalCode: extCode,
          transportMode: mode,
        },
      });
    }

    revalidatePath("/expedients");
    return { success: true };
  } catch (err) {
    console.error("Error in ensureExpedientExternalCodesAction:", err);
    return { success: false };
  }
}
