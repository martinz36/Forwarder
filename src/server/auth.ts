import "server-only";
import { createHash } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/server/db";

function authSecret(): string {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  // Mientras no se configure BETTER_AUTH_SECRET en Vercel, se deriva de la conexión a la base
  // (que ya es secreta). Configurar la variable propia antes de pasar a producción.
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta BETTER_AUTH_SECRET o DATABASE_URL");
  return createHash("sha256").update(`forwarder-auth:${url}`).digest("hex");
}

function createAuth() {
  return betterAuth({
    secret: authSecret(),
    baseURL: {
      allowedHosts: ["localhost:*", "127.0.0.1:*", "*.vercel.app", ...(process.env.APP_HOSTS?.split(",") ?? [])],
      protocol: process.env.NODE_ENV === "production" ? "https" : "auto",
      fallback: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
    },
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      // Las cuentas solo se crean aceptando una invitación (ver acceptInvitation).
      disableSignUp: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14, // 14 días
      updateAge: 60 * 60 * 24,
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;
const globalForAuth = globalThis as unknown as { auth?: Auth };

/** Se crea al primer uso para que el build no necesite conexión a la base. */
export function getAuth(): Auth {
  globalForAuth.auth ??= createAuth();
  return globalForAuth.auth;
}
