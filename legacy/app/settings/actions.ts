"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { CompanyProfileData, DEFAULT_COMPANY_PROFILE } from "@/lib/company";

export async function updateCompanyProfileAction(data: Partial<CompanyProfileData>) {
  try {
    const updated = await prisma.companyProfile.upsert({
      where: { id: "default" },
      update: {
        legalName: data.legalName?.trim() || DEFAULT_COMPANY_PROFILE.legalName,
        tradeName: data.tradeName?.trim() || DEFAULT_COMPANY_PROFILE.tradeName,
        ruc: data.ruc ? data.ruc.replace(/\D/g, "").slice(0, 11) : "",
        address: data.address?.trim() || DEFAULT_COMPANY_PROFILE.address,
        phone: data.phone?.trim() || DEFAULT_COMPANY_PROFILE.phone,
        email: data.email?.trim() || "",
        website: data.website?.trim() || "",
      },
      create: {
        id: "default",
        legalName: data.legalName?.trim() || DEFAULT_COMPANY_PROFILE.legalName,
        tradeName: data.tradeName?.trim() || DEFAULT_COMPANY_PROFILE.tradeName,
        ruc: data.ruc ? data.ruc.replace(/\D/g, "").slice(0, 11) : "",
        address: data.address?.trim() || DEFAULT_COMPANY_PROFILE.address,
        phone: data.phone?.trim() || DEFAULT_COMPANY_PROFILE.phone,
        email: data.email?.trim() || "",
        website: data.website?.trim() || "",
      },
    });

    revalidatePath("/settings");
    revalidatePath("/quotations");
    revalidatePath("/operations");

    return { success: true, profile: updated };
  } catch (err: any) {
    console.error("Error updating company profile:", err);
    return {
      success: false,
      error: typeof err?.message === "string" ? err.message : "Error al actualizar la configuración.",
    };
  }
}
