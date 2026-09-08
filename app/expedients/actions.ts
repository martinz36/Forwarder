"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function createExpedientAction(formData: {
  clientId: string;
  notes?: string;
}) {
  if (!formData.clientId) {
    throw new Error("Debes seleccionar un cliente para abrir un expediente.");
  }

  const count = await prisma.expedient.count();
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, "0");
  const code = `EXP-${year}-${sequence}`;

  const expedient = await prisma.expedient.create({
    data: {
      code,
      clientId: formData.clientId,
      notes: formData.notes?.trim() || null,
      status: "OPEN",
    },
  });

  revalidatePath("/expedients");
  revalidatePath(`/clients/${formData.clientId}`);
  redirect(`/expedients/${expedient.id}`);
}
