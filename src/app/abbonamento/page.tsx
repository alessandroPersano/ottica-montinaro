import type { Metadata } from "next";
export const instant = false;
import { Panel } from "@/components/ui";

export const metadata: Metadata = { title: "Abbonamento lenti a contatto" };

export default function SubscriptionInfoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1>Lenti in abbonamento</h1>
      <p>Ricevi la fornitura ogni 30, 60 o 90 giorni, se il prodotto lo consente. Il pagamento è sempre con carta, anche se ritiri in negozio: il contante non può coprire un addebito ricorrente.</p>
      <div className="grid gap-4">
        <Panel><h2>1. Configurazione</h2><p>Usi una configurazione già verificata oppure ne invii una nuova. Finché non la controlliamo, non evadiamo.</p></Panel>
        <Panel><h2>2. Carta</h2><p>Stripe addebita la carta a ogni ciclo. Puoi aggiornarla o disdire a fine periodo dal portale pagamenti.</p></Panel>
        <Panel><h2>3. Se la configurazione scade</h2><p>L&apos;abbonamento resta attivo, ma la consegna successiva si ferma finché non rifacciamo la verifica.</p></Panel>
      </div>
    </main>
  );
}
