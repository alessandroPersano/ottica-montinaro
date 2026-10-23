import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Manca DATABASE_URL. Non applico alcuna migrazione.");
  }
  const { getDb } = await import("../src/db");
  const database = getDb();
  if (url.startsWith("pglite:")) {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    await migrate(database, { migrationsFolder: "./drizzle" });
  } else if (url.includes("neon.tech")) {
    const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
    await migrate(database as never, { migrationsFolder: "./drizzle" });
  } else {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    await migrate(database as never, { migrationsFolder: "./drizzle" });
  }
  console.log("Migrazioni applicate.");
  const { closeDb } = await import("../src/db");
  await closeDb();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Errore sconosciuto";
  const cause = error instanceof Error ? error.cause : undefined;
  console.error(message);
  if (cause) console.error(cause);
  process.exit(1);
});
