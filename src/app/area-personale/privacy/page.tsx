export const instant = false;

import { desc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { consentEvents } from "@/db/schema";
import { requireOwnCustomer } from "@/server/guard";

export default async function PrivacyAccountPage() {
  await connection();
  const { session, profile } = await requireOwnCustomer();
  const events = await getDb().select().from(consentEvents).where(eq(consentEvents.userId, session.user.id)).orderBy(desc(consentEvents.createdAt));
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1>Privacy e consensi</h1>
      <p>Marketing: {profile.marketingConsent ? "attivo" : "non attivo"}.</p>
      <p>Per rettifica o cancellazione scrivi in negozio: la cancellazione dell&apos;account viene anonimizzata dove restano obblighi fiscali.</p>
      <ul>{events.map((event) => <li key={event.id}>{event.documentType} · {event.documentVersion} · {event.accepted ? "accolto" : "non accolto"}</li>)}</ul>
    </main>
  );
}
