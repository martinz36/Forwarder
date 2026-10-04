import { createHash, randomBytes } from "node:crypto";
import type { Db } from "@/server/db";
import type { MemberRole } from "@/generated/prisma/enums";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Crea una invitación de un solo uso. Devuelve el token en claro: solo se muestra una vez,
 * en la base queda guardado su hash.
 */
export async function createInvitation(
  db: Db,
  input: { organizationId: string; role: MemberRole; email?: string | null; days?: number; invitedById?: string | null },
) {
  const token = randomBytes(32).toString("base64url");
  const invitation = await db.invitation.create({
    data: {
      organizationId: input.organizationId,
      role: input.role,
      email: input.email?.trim().toLowerCase() || null,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + (input.days ?? 7) * 24 * 60 * 60 * 1000),
      invitedById: input.invitedById ?? null,
    },
  });
  return { token, invitation };
}
