import { config } from "dotenv";

config({ path: ".env" });

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Amministratore";
  if (!email || !password) {
    throw new Error("Imposta ADMIN_EMAIL e ADMIN_PASSWORD nell'ambiente. Non scriverli nel repository.");
  }
  if (password.length < 12) throw new Error("La password dell'amministratore deve avere almeno 12 caratteri.");
  const { hashPassword } = await import("better-auth/crypto");
  const { getDb } = await import("../src/db");
  const { user, account, staffProfiles, customerProfiles } = await import("../src/db/schema");
  const { eq } = await import("drizzle-orm");
  const database = getDb();
  const existing = await database.select().from(user).where(eq(user.email, email.toLowerCase())).limit(1);
  if (existing[0]) {
    await database.update(user).set({ role: "ADMIN", emailVerified: true }).where(eq(user.id, existing[0].id));
    console.log("Utente esistente promosso ad amministratore.");
    return;
  }
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await database.insert(user).values({ id, name, email: email.toLowerCase(), emailVerified: true, role: "ADMIN" });
  await database.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: "credential", userId: id, password: passwordHash });
  await database.insert(staffProfiles).values({ userId: id });
  const [first, ...rest] = name.split(/\s+/);
  await database.insert(customerProfiles).values({ userId: id, firstName: first || "Admin", lastName: rest.join(" ") || "—", email: email.toLowerCase() });
  console.log("Amministratore creato. La password non viene stampata.");
}

main()
  .then(async () => {
    const { closeDb } = await import("../src/db");
    await closeDb();
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Creazione non riuscita");
    process.exit(1);
  });
