import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const { seedDemo } = await import("../src/server/seed");
  await seedDemo();
  console.log("Seed demo completato. Account: demo.admin@example.com, demo.operatore@example.com, demo.cliente@example.com");
  const { closeDb } = await import("../src/db");
  await closeDb();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed non riuscito");
  process.exit(1);
});
