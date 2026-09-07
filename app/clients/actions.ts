"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export async function createClientAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;

  if (!name || name.trim() === "") {
    throw new Error("El nombre / Razón Social es requerido.");
  }

  await prisma.client.create({
    data: {
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
      address: address ? address.trim() : null,
      status: "ACTIVE",
    },
  });

  revalidatePath("/clients");
}
