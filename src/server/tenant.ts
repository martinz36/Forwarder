import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth";
import { getDb } from "@/server/db";

export const getSession = cache(async () => getAuth().api.getSession({ headers: await headers() }));

/**
 * Usuario, empresa y rol de quien hace la petición. Toda consulta de negocio debe
 * filtrar por `organization.id`. Sin sesión → login; sin empresa → sin acceso.
 */
export const requireTenant = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/ingresar");

  const activeOrg = (session.session as { activeOrganizationId?: string | null }).activeOrganizationId;
  const membership = await getDb().membership.findFirst({
    where: { userId: session.user.id, isActive: true, ...(activeOrg ? { organizationId: activeOrg } : {}) },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) redirect("/sin-acceso");

  return { user: session.user, organization: membership.organization, role: membership.role };
});

export type Tenant = Awaited<ReturnType<typeof requireTenant>>;
