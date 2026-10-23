import { connection } from "next/server";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { Money, Panel } from "@/components/ui";
import { getCart } from "@/server/commerce";
import { requirePageUser } from "@/server/guard";

export const instant = false;

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="p-8">Caricamento checkout…</main>}>
      <CheckoutBody />
    </Suspense>
  );
}

async function CheckoutBody() {
  await connection();
  const session = await requirePageUser();
  const { items } = await getCart(session.user.id);
  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1>Checkout</h1>
      <Panel>
        {items.length === 0 ? <p>Il carrello è vuoto.</p> : items.map((item) => (
          <p key={item.id}>{item.name} · {item.eye === "RIGHT" ? "destro" : "sinistro"} · {item.quantity} · <Money cents={item.priceCents * item.quantity} /></p>
        ))}
        <p>Totale merci <Money cents={total} />. La spedizione, se scelta, si aggiunge al passo successivo in base alle impostazioni.</p>
      </Panel>
      <CheckoutForm />
    </main>
  );
}
