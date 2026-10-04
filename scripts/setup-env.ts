/**
 * Toma NEON_URL del archivo .env y genera las tres conexiones que usa el sistema:
 *   DATABASE_URL         pooler, esquema "app"   (la aplicación)
 *   DIRECT_URL           directa, esquema "app"  (migraciones e importación)
 *   LEGACY_DATABASE_URL  directa, esquema public (lectura del sistema anterior)
 * Luego prueba la conexión solo con consultas de lectura. Nunca imprime la clave.
 *
 *   npm run env:setup
 */
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const ENV_PATH = ".env";

function readNeonUrl(): string {
  const content = readFileSync(ENV_PATH, "utf8");
  const match = content.match(/^\s*NEON_URL\s*=\s*["']?([^"'\r\n]*)["']?\s*$/m);
  const value = match?.[1]?.trim() ?? "";
  // Neon a veces copia el comando completo: psql 'postgresql://…'
  const url = value.match(/postgres(?:ql)?:\/\/\S+/)?.[0] ?? "";
  if (!url) throw new Error("No encontré una cadena postgresql:// en NEON_URL del archivo .env.");
  return url;
}

function variants(raw: string) {
  const base = new URL(raw.replace(/^postgres:\/\//, "postgresql://"));
  base.searchParams.delete("schema");
  // verify-full: valida el certificado de Neon (es lo que pg ya hace con "require").
  base.searchParams.set("sslmode", "verify-full");

  const [endpoint, ...rest] = base.hostname.split(".");
  if (!endpoint || !base.hostname.endsWith("neon.tech")) {
    throw new Error(`El host ${base.hostname} no parece de Neon.`);
  }
  const directHost = [endpoint.replace(/-pooler$/, ""), ...rest].join(".");
  const pooledHost = [`${endpoint.replace(/-pooler$/, "")}-pooler`, ...rest].join(".");

  const make = (host: string, schema?: string) => {
    const u = new URL(base.toString());
    u.hostname = host;
    if (schema) u.searchParams.set("schema", schema);
    return u.toString();
  };
  return {
    database: make(pooledHost, "app"),
    direct: make(directHost, "app"),
    legacy: make(directHost),
    summary: `${decodeURIComponent(base.username)} @ ${directHost} / ${base.pathname.slice(1)}`,
  };
}

function writeEnv(neonUrl: string, v: ReturnType<typeof variants>) {
  writeFileSync(
    ENV_PATH,
    `# Conexión de Neon pegada por ti. Si cambia la clave, reemplázala aquí y corre: npm run env:setup
NEON_URL="${neonUrl}"

# Generadas automáticamente a partir de NEON_URL (no editar a mano).
DATABASE_URL="${v.database}"
DIRECT_URL="${v.direct}"
LEGACY_DATABASE_URL="${v.legacy}"
`,
    "utf8",
  );
}

async function check(legacyUrl: string) {
  const client = new pg.Client({ connectionString: legacyUrl.replace(/([?&])schema=[^&]*&?/, "$1") });
  await client.connect();
  try {
    const one = async (sql: string) => (await client.query(sql)).rows[0];
    const version = await one("show server_version");
    const exists = async (table: string) => Boolean((await one(`select to_regclass('public."${table}"') as t`)).t);
    const countOf = async (table: string) => ((await exists(table)) ? Number((await one(`select count(*) from public."${table}"`)).count) : null);
    const appSchema = Boolean((await one(`select 1 as x from information_schema.schemata where schema_name = 'app'`))?.x);
    return {
      postgres: version.server_version as string,
      clientes: await countOf("Client"),
      cotizaciones: await countOf("Quotation"),
      operaciones: await countOf("Operation"),
      documentos: await countOf("Document"),
      esquemaNuevoYaCreado: appSchema,
    };
  } finally {
    await client.end();
  }
}

const neonUrl = readNeonUrl();
const v = variants(neonUrl);
writeEnv(neonUrl, v);
console.log(`Conexión configurada: ${v.summary}`);
const result = await check(v.legacy);
console.log("Prueba de conexión (solo lectura):");
console.table(result);
