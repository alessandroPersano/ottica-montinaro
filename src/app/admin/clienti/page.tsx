export const instant = false;

import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { customerProfiles } from "@/db/schema";

export default async function CustomersPage() {
  await connection();
  const rows = await getDb().select().from(customerProfiles).orderBy(asc(customerProfiles.lastName)).limit(100);
  return (
    <div>
      <h1>Clienti</h1>
      <ul>{rows.map((row) => <li key={row.id}>{row.firstName} {row.lastName} · {row.email ?? "senza email"} · {row.phone ?? "senza telefono"}</li>)}</ul>
    </div>
  );
}
