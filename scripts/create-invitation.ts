/**
 * Crea un enlace de invitación para entrar al sistema.
 *
 *   npm run invite:create -- --url=https://mi-app.vercel.app [--org=marivan] [--role=OWNER] [--email=correo] [--days=7]
 *
 * Sin --email, cualquiera con el enlace puede aceptarlo una sola vez: compártelo solo por un canal privado.
 */
import "dotenv/config";
import { createDb } from "../src/server/db";
import { createInvitation } from "../src/server/invitations";
import type { MemberRole } from "../src/generated/prisma/enums";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const baseUrl = arg("url")?.replace(/\/$/, "");
if (!baseUrl) throw new Error("Indica la URL de la app con --url=https://…");
const role = (arg("role") ?? "OWNER").toUpperCase() as MemberRole;

const db = createDb(process.env.DIRECT_URL ?? process.env.DATABASE_URL);
try {
  const org = await db.organization.findUniqueOrThrow({ where: { slug: arg("org") ?? "marivan" } });
  const { token, invitation } = await createInvitation(db, {
    organizationId: org.id,
    role,
    email: arg("email"),
    days: Number(arg("days") ?? 7),
  });
  console.log(`Invitación para ${org.name} (${role}), vence el ${invitation.expiresAt.toLocaleDateString("es-PE")}:`);
  console.log(`${baseUrl}/invitacion/${token}`);
} finally {
  await db.$disconnect();
}
