"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db";
import { requireTenant } from "@/server/tenant";
import { int, num, str, toActionError, type ActionState } from "@/server/action-utils";
import { DomainError } from "@/server/expedientes";

export async function updateOrganizationAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const { organization, role } = await requireTenant();
    if (role !== "OWNER" && role !== "ADMIN") throw new DomainError("Solo el propietario o un administrador pueden cambiar la configuración.");
    const legalName = str(fd, "legalName");
    const name = str(fd, "name");
    if (!legalName || !name) return { error: "La razón social y el nombre comercial son obligatorios." };
    const taxId = str(fd, "taxId")?.replace(/\D/g, "") ?? null;
    if (taxId && taxId.length !== 11) return { error: "El RUC debe tener 11 dígitos." };
    const validity = int(fd, "quoteValidityDays");
    const markup = num(fd, "defaultMarkupPct");

    await getDb().organization.update({
      where: { id: organization.id },
      data: {
        legalName,
        name,
        taxId,
        address: str(fd, "address"),
        phone: str(fd, "phone"),
        email: str(fd, "email"),
        website: str(fd, "website"),
        quoteValidityDays: validity && validity > 0 && validity <= 365 ? validity : organization.quoteValidityDays,
        defaultMarkupPct: markup !== null && markup >= 0 && markup <= 500 ? String(markup) : organization.defaultMarkupPct,
        quoteTerms: str(fd, "quoteTerms"),
        paymentInstructions: str(fd, "paymentInstructions"),
      },
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/", "layout");
  return { ok: "Configuración guardada" };
}
