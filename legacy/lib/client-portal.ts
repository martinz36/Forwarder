import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

/**
 * Ensures a client has a valid portalToken. If null, generates one and updates the database.
 */
export async function getOrGenerateClientPortalToken(clientId: string, existingToken?: string | null): Promise<string> {
  if (existingToken && existingToken.trim().length > 0) {
    return existingToken;
  }

  const token = randomUUID();
  const updated = await prisma.client.update({
    where: { id: clientId },
    data: { portalToken: token },
    select: { portalToken: true },
  });

  return updated.portalToken || token;
}
