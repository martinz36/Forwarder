"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { clientSchema, ClientFormValues } from "@/lib/validations/client";

export async function createClientAction(data: ClientFormValues) {
  try {
    const validated = clientSchema.parse(data);

    // Check if documentNumber already exists
    const existing = await prisma.client.findUnique({
      where: { documentNumber: validated.documentNumber.trim() },
    });

    if (existing) {
      return {
        success: false,
        error: `El número de documento ${validated.documentNumber} ya está registrado para ${existing.businessName}.`,
      };
    }

    const newClient = await prisma.client.create({
      data: {
        documentType: validated.documentType,
        documentNumber: validated.documentNumber.trim(),
        businessName: validated.businessName.trim(),
        contactName: validated.contactName ? validated.contactName.trim() : null,
        email: validated.email ? validated.email.trim() : null,
        phone: validated.phone ? validated.phone.trim() : null,
        address: validated.address ? validated.address.trim() : null,
        status: "ACTIVE",
      },
    });

    revalidatePath("/clients");
    revalidatePath("/quotations/new");

    return {
      success: true,
      client: {
        id: newClient.id,
        businessName: newClient.businessName,
        documentNumber: newClient.documentNumber,
      },
    };
  } catch (err: any) {
    if (err?.issues && Array.isArray(err.issues) && err.issues.length > 0) {
      return {
        success: false,
        error: err.issues[0]?.message || "Datos de cliente no válidos.",
      };
    }
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al registrar el cliente.",
    };
  }
}

export async function updateClientAction(clientId: string, data: ClientFormValues) {
  if (!clientId) {
    throw new Error("ID de cliente no proporcionado.");
  }

  const validated = clientSchema.parse(data);

  // Check if documentNumber exists on another client
  const existing = await prisma.client.findFirst({
    where: {
      documentNumber: validated.documentNumber.trim(),
      NOT: { id: clientId },
    },
  });

  if (existing) {
    throw new Error(`El número de documento ${validated.documentNumber} ya está registrado para otro cliente (${existing.businessName}).`);
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      documentType: validated.documentType,
      documentNumber: validated.documentNumber.trim(),
      businessName: validated.businessName.trim(),
      contactName: validated.contactName ? validated.contactName.trim() : null,
      email: validated.email ? validated.email.trim() : null,
      phone: validated.phone ? validated.phone.trim() : null,
      address: validated.address ? validated.address.trim() : null,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/quotations/new");
}

export async function addClientNoteAction(clientId: string, content: string) {
  if (!clientId) {
    throw new Error("ID de cliente no válido.");
  }

  if (!content || content.trim() === "") {
    throw new Error("El contenido de la nota no puede estar vacío.");
  }

  await prisma.clientNote.create({
    data: {
      clientId,
      content: content.trim(),
      createdBy: "BROKER",
    },
  });

  revalidatePath(`/clients/${clientId}`);
}
