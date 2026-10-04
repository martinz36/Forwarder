import prisma from "@/lib/prisma";

export interface CompanyProfileData {
  legalName: string;
  tradeName: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfileData = {
  legalName: "Marivan Logistics SAC",
  tradeName: "Marivan Logistics",
  ruc: "",
  address: "Calle Españoletto 115, departamento 101, San Borja",
  phone: "969 3010 95",
  email: "operaciones@marivanlogistics.com",
  website: "www.marivanlogistics.com",
};

export async function getCompanyProfile(): Promise<CompanyProfileData> {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: { id: "default" },
    });

    if (profile) {
      return {
        legalName: profile.legalName || DEFAULT_COMPANY_PROFILE.legalName,
        tradeName: profile.tradeName || DEFAULT_COMPANY_PROFILE.tradeName,
        ruc: profile.ruc ?? DEFAULT_COMPANY_PROFILE.ruc,
        address: profile.address || DEFAULT_COMPANY_PROFILE.address,
        phone: profile.phone || DEFAULT_COMPANY_PROFILE.phone,
        email: profile.email ?? DEFAULT_COMPANY_PROFILE.email,
        website: profile.website ?? DEFAULT_COMPANY_PROFILE.website,
      };
    }

    // Auto-create default record on first access
    const created = await prisma.companyProfile.create({
      data: {
        id: "default",
        ...DEFAULT_COMPANY_PROFILE,
      },
    });

    return {
      legalName: created.legalName,
      tradeName: created.tradeName,
      ruc: created.ruc,
      address: created.address,
      phone: created.phone,
      email: created.email,
      website: created.website,
    };
  } catch (err) {
    console.error("Error retrieving company profile:", err);
    return DEFAULT_COMPANY_PROFILE;
  }
}
