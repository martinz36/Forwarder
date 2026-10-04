import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Esquema Postgres de la v2. El sistema anterior sigue en `public`. */
export const DEFAULT_SCHEMA = "app";

/**
 * Separa el parámetro `schema` de la URL (lo entiende Prisma Migrate, no el driver `pg`)
 * y lo pasa al adaptador.
 */
export function parseDatabaseUrl(url: string): { connectionString: string; schema?: string } {
  const parsed = new URL(url);
  const schema = parsed.searchParams.get("schema") ?? undefined;
  parsed.searchParams.delete("schema");
  return { connectionString: parsed.toString(), schema };
}

export function createDb(url = process.env.DATABASE_URL): PrismaClient {
  if (!url) throw new Error("Falta DATABASE_URL");
  const { connectionString, schema } = parseDatabaseUrl(url);
  // En Vercel DATABASE_URL es la misma del sistema anterior (sin ?schema), por eso el valor por defecto.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema: schema ?? process.env.DB_SCHEMA ?? DEFAULT_SCHEMA }),
  });
}

const globalForDb = globalThis as unknown as { db?: PrismaClient };

export function getDb(): PrismaClient {
  globalForDb.db ??= createDb();
  return globalForDb.db;
}

export type Db = PrismaClient;
