import { connection } from "next/server";
import { Suspense } from "react";
import { removeFromCart } from "@/app/actions/shop";
import { Money, Panel } from "@/components/ui";
import { getCart } from "@/server/commerce";
import { requirePageUser } from "@/server/guard";
import Link from "next/link";

export const instant = false;

export default function CartPage() {
  return (
    <Suspense fallback={<main className="p-8">Caricamento carrello…</main>}>
      <CartBody />
    </Suspense>
  );
}

async function CartBody() {
  await connection();
  const session = await requirePageUser();
  const { items } = await getCart(session.user.id);
  const total = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1>Carrello</h1>
      {items.length === 0 ? <Panel><p>Non hai ancora lenti nel carrello.</p><Link href="/catalogo">Vai al catalogo</Link></Panel> : null}
      {items.map((item) => (
        <Panel key={item.id} className="mb-3">
          <h2 className="mt-0">{item.name}</h2>
          <p>{item.eye === "RIGHT" ? "Occhio destro" : "Occhio sinistro"} · {item.quantity} confezioni</p>
          <p><Money cents={item.priceCents * item.quantity} /></p>
          <form action={removeFromCart}><input type="hidden" name="itemId" value={item.id} /><button className="min-h-11" type="submit">Rimuovi</button></form>
        </Panel>
      ))}
      {items.length > 0 ? <p>Totale merci <Money cents={total} />. <Link href="/checkout">Vai al checkout</Link></p> : null}
    </main>
  );
}
