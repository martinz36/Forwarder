/**
 * Usuario de prueba SOLO para una base local (localhost). Se niega a correr contra Neon.
 *
 *   DEV_USER_PASSWORD=<una-clave-local> npm run dev:user
 *
 * Correo: prueba@forwarder.test. La contraseña se pasa por variable de entorno y no se guarda en el repo.
 */
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { createDb } from "../src/server/db";

const TEST_EMAIL = "prueba@forwarder.test";
const password = process.env.DEV_USER_PASSWORD;
if (!password || password.length < 8) throw new Error("Define DEV_USER_PASSWORD (mínimo 8 caracteres).");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const host = url ? new URL(url).hostname : "";
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  throw new Error(`Este script solo corre contra una base local (host actual: ${host || "ninguno"}).`);
}

const db = createDb(url);
try {
  const org = await db.organization.findUniqueOrThrow({ where: { slug: process.argv[2] ?? "marivan" } });
  const user = await db.user.upsert({
    where: { email: TEST_EMAIL },
    create: { email: TEST_EMAIL, name: "Usuario de prueba", emailVerified: true },
    update: {},
  });
  await db.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
  await db.account.create({
    data: { userId: user.id, providerId: "credential", accountId: user.id, password: await hashPassword(password) },
  });
  await db.membership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    create: { organizationId: org.id, userId: user.id, role: "OWNER" },
    update: { isActive: true },
  });
  console.log(`Usuario de prueba listo en ${org.name}: ${TEST_EMAIL}`);
} finally {
  await db.$disconnect();
}
