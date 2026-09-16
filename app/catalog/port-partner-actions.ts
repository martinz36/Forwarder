"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

export const OFFICIAL_INCOTERMS = [
  { value: "EXW", label: "EXW - Ex Works (En fábrica)" },
  { value: "FCA", label: "FCA - Free Carrier (Franco transportista)" },
  { value: "FAS", label: "FAS - Free Alongside Ship (Franco al costado del buque)" },
  { value: "FOB", label: "FOB - Free on Board (Franco a bordo)" },
  { value: "CFR", label: "CFR - Cost and Freight (Costo y flete)" },
  { value: "CIF", label: "CIF - Cost, Insurance and Freight (Costo, seguro y flete)" },
  { value: "CPT", label: "CPT - Carriage Paid To (Transporte pagado hasta)" },
  { value: "CIP", label: "CIP - Carriage and Insurance Paid To (Transporte y seguro pagados hasta)" },
  { value: "DAP", label: "DAP - Delivered at Place (Entregado en lugar)" },
  { value: "DPU", label: "DPU - Delivered at Place Unloaded (Entregado en lugar descargado)" },
  { value: "DDP", label: "DDP - Delivered Duty Paid (Entregado derechos pagados)" },
];

export async function getPortsAction() {
  try {
    let ports = await prisma.port.findMany({
      orderBy: { name: "asc" },
    });

    // Seed default common ports if empty
    if (ports.length === 0) {
      const defaultPorts = [
        { code: "PECLL", name: "CALLAO - PERU", country: "PERU" },
        { code: "CNSHA", name: "SHANGHAI", country: "CHINA" },
        { code: "CNNGB", name: "NINGBO", country: "CHINA" },
        { code: "CNTAO", name: "QINGDAO", country: "CHINA" },
        { code: "CNSZX", name: "SHENZHEN", country: "CHINA" },
        { code: "KRPUS", name: "BUSAN", country: "SOUTH KOREA" },
        { code: "DEHAM", name: "HAMBURG", country: "GERMANY" },
        { code: "NLRTM", name: "ROTTERDAM", country: "NETHERLANDS" },
        { code: "USLAX", name: "LOS ANGELES", country: "USA" },
        { code: "USMIA", name: "MIAMI", country: "USA" },
      ];

      await prisma.port.createMany({
        data: defaultPorts,
        skipDuplicates: true,
      });

      ports = await prisma.port.findMany({
        orderBy: { name: "asc" },
      });
    }

    return { success: true, data: ports };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al cargar puertos.", data: [] };
  }
}

export async function createPortAction(name: string, code?: string, country?: string) {
  try {
    const trimmedName = name.trim().toUpperCase();
    if (!trimmedName) {
      throw new Error("El nombre del puerto no puede estar vacío.");
    }

    // Generate code if not provided
    const portCode = (code || `PRT-${trimmedName.replace(/[^A-Z0-9]/g, "").slice(0, 5)}`).toUpperCase();

    // Check if exists by name or code
    let port = await prisma.port.findFirst({
      where: {
        OR: [{ name: trimmedName }, { code: portCode }],
      },
    });

    if (!port) {
      port = await prisma.port.create({
        data: {
          name: trimmedName,
          code: portCode,
          country: country ? country.trim().toUpperCase() : "",
        },
      });
    }

    revalidatePath("/quotations/new");
    revalidatePath("/operations");

    return { success: true, data: port };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al crear el puerto." };
  }
}

export async function getPartnersAction(type?: "SHIPPER" | "CARRIER" | string) {
  try {
    let partners = await prisma.partner.findMany({
      where: type ? { type } : undefined,
      orderBy: { name: "asc" },
    });

    // Seed defaults if empty
    if (partners.length === 0) {
      const defaultPartners = [
        { name: "MAERSK LINE", type: "CARRIER" },
        { name: "MSC (MEDITERRANEAN SHIPPING CO)", type: "CARRIER" },
        { name: "CMA CGM", type: "CARRIER" },
        { name: "COSCO SHIPPING", type: "CARRIER" },
        { name: "HAPAG-LLOYD", type: "CARRIER" },
        { name: "ONE (OCEAN NETWORK EXPRESS)", type: "CARRIER" },
        { name: "EVERGREEN LINE", type: "CARRIER" },
        { name: "Jiaxing Whatz Games Co.,Ltd", type: "SHIPPER" },
        { name: "Ningbo Trading Co., Ltd", type: "SHIPPER" },
        { name: "Shanghai Logistics Export Ltd", type: "SHIPPER" },
      ];

      await prisma.partner.createMany({
        data: defaultPartners,
        skipDuplicates: true,
      });

      partners = await prisma.partner.findMany({
        where: type ? { type } : undefined,
        orderBy: { name: "asc" },
      });
    }

    return { success: true, data: partners };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al cargar socios comerciales.", data: [] };
  }
}

export async function createPartnerAction(name: string, type: "SHIPPER" | "CARRIER" | string = "SHIPPER") {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error("El nombre de la empresa no puede estar vacío.");
    }

    let partner = await prisma.partner.findUnique({
      where: { name: trimmedName },
    });

    if (!partner) {
      partner = await prisma.partner.create({
        data: {
          name: trimmedName,
          type,
        },
      });
    }

    revalidatePath("/quotations/new");
    revalidatePath("/operations");

    return { success: true, data: partner };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al crear socio comercial." };
  }
}
