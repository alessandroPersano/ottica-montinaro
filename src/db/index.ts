import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

export type AppDatabase = PgliteDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  db?: AppDatabase;
  pglite?: PGlite;
};

neonConfig.webSocketConstructor = ws;

export function getDb(): AppDatabase {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Manca DATABASE_URL. Copia .env.example in .env e indica il database.");
  }

  if (url.startsWith("pglite:")) {
    const building = process.env.NEXT_PHASE === "phase-production-build";
    const dataDir = building ? undefined : url.slice("pglite:".length) || ".data/pglite";
    if (dataDir) mkdirSync(dataDir, { recursive: true });
    const client = globalForDb.pglite ?? (dataDir ? new PGlite(dataDir) : new PGlite());
    globalForDb.pglite = client;
    globalForDb.db = drizzlePglite({ client, schema });
    return globalForDb.db;
  }

  if (url.includes("neon.tech")) {
    const pool = new Pool({ connectionString: url });
    globalForDb.db = drizzleNeon({ client: pool, schema }) as unknown as AppDatabase;
    return globalForDb.db;
  }

  const client = postgres(url, { max: 10 });
  globalForDb.db = drizzlePostgres({ client, schema }) as unknown as AppDatabase;
  return globalForDb.db;
}

export async function closeDb() {
  const client = globalForDb.pglite;
  globalForDb.db = undefined;
  globalForDb.pglite = undefined;
  await client?.close();
}

export async function createMemoryDatabase(): Promise<AppDatabase> {
  const client = new PGlite();
  return drizzlePglite({ client, schema });
}
