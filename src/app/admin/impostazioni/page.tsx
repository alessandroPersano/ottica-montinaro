export const instant = false;

import { connection } from "next/server";
import { requireStaffPage } from "@/server/guard";
import { getSettings } from "@/server/settings";
import { Panel } from "@/components/ui";

export default async function SettingsPage() {
  await connection();
  await requireStaffPage("settings");
  const settings = await getSettings();
  return (
    <div>
      <h1>Impostazioni</h1>
      {settings.brandProvisional ? <p>L&apos;identità visiva è provvisoria finché non arrivano i materiali del sito istituzionale.</p> : null}
      <Panel>
        <p>Soglia spedizione gratuita: {settings.freeShippingThresholdCents / 100} euro</p>
        <p>Costo spedizione: {settings.shippingCostCents / 100} euro</p>
        <p>Prenotazione ritiro: {settings.pickupReservationDays} giorni</p>
        <p>Pagamento al ritiro: {settings.payAtPickupEnabled ? "attivo" : "disattivo"}</p>
        <p>Contanti: {settings.payAtPickupCash ? "sì" : "no"} · Carta/POS: {settings.payAtPickupCard ? "sì" : "no"}</p>
        <p>Telefono pubblicato: {settings.supportPhone ?? "non impostato"}</p>
        <p>Email pubblicata: {settings.supportEmail ?? "non impostata, in attesa di conferma"}</p>
        <p>Orari: {settings.storeHours ?? "non pubblicati"}</p>
      </Panel>
    </div>
  );
}
