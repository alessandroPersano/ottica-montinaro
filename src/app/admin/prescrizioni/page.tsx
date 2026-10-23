export const instant = false;

import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { validateConfiguration } from "@/app/actions/admin";
import { getDb } from "@/db";
import { prescriptions } from "@/db/schema";

export default async function PrescriptionsAdminPage() {
  await connection();
  const rows = await getDb().select().from(prescriptions).where(eq(prescriptions.status, "PENDING_REVIEW"));
  return (
    <div>
      <h1>Configurazioni da verificare</h1>
      <p>La verifica non è una diagnosi online: conferma solo che i parametri indicati sono quelli da usare per l&apos;ordine.</p>
      {rows.length === 0 ? <p>Nessuna configurazione in attesa.</p> : null}
      <ul className="grid gap-3">
        {rows.map((row) => (
          <li key={row.id}>
            <form action={validateConfiguration}>
              <input type="hidden" name="prescriptionId" value={row.id} />
              <button className="min-h-11 rounded-xl bg-teal px-4 text-white" type="submit">Segna come verificata</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
