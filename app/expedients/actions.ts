"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export interface CreateExpedientInput {
  clientId: string;
  loadType?: "FCL" | "LCL" | "AÉREO" | "TERRESTRE";
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

  let code = input.customCode?.trim();
  if (!code) {
    const count = await prisma.expedient.count();
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, "0");
    const clientSlug = slugifyBusinessName(client.businessName);

    code = `EXP-${year}-${clientSlug}-${loadType}-${sequence}`;
  }

  const expedient = await prisma.expedient.create({
    data: {
      code,
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
