export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.AUTO_MIGRATE !== "true") return;
  const { getDb } = await import("@/db");
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("pglite:")) return;
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
  if (process.env.SEED_ON_BOOT === "true") {
    const { seedDemo } = await import("@/server/seed");
    await seedDemo();
  }
}
