import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import pg from "pg";
import { createDb, type Db } from "../../src/server/db";

/**
 * Postgres en memoria (PGlite) con todas las migraciones aplicadas en el esquema `app`,
 * igual que en Neon. Se crea y se destruye con cada corrida de pruebas.
 */
export async function startTestDb(): Promise<{ db: Db; url: string; stop: () => Promise<void> }> {
  const pglite = new PGlite();
  await pglite.waitReady;
  const port = 56000 + Math.floor(Math.random() * 2000);
  const server = new PGLiteSocketServer({ db: pglite, port, maxConnections: 20 });
  await server.start();
  const base = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;

  const client = new pg.Client({ connectionString: base });
  await client.connect();
  await client.query(`CREATE SCHEMA app; SET search_path TO app;`);
  const dir = join(process.cwd(), "prisma", "migrations");
  for (const name of readdirSync(dir).filter((n) => /^\d+_/.test(n)).sort()) {
    await client.query(readFileSync(join(dir, name, "migration.sql"), "utf8"));
  }
  await client.end();

  const url = `${base}?schema=app`;
  const db = createDb(url);
  return {
    db,
    url,
    stop: async () => {
      await db.$disconnect();
      await server.stop();
      await pglite.close();
    },
  };
}
