import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Panel } from "@/components/ui";
import { getSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Contatti" };
export const instant = false;

export default function ContactsPage() {
  return (
    <Suspense fallback={<main className="p-8">Caricamento contatti…</main>}>
      <Contacts />
    </Suspense>
  );
}

async function Contacts() {
  await connection();
  const settings = await getSettings();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1>Vieni a trovarci</h1>
      <Panel>
        <p>Ottica Montinaro</p>
        <p>{settings.pickupAddress}</p>
        {settings.supportPhone ? <p>Telefono: <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`}>{settings.supportPhone}</a></p> : null}
        <p>{settings.storeHours ?? "Gli orari pubblicati sono in aggiornamento. Chiama prima di passare."}</p>
        <p>Ottica, optometria e contattologia. Attività dal 1984.</p>
      </Panel>
    </main>
  );
}
