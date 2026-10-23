"use client";

import { useState } from "react";
import { checkoutAction } from "@/app/actions/shop";

export function CheckoutForm() {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="mt-6 grid gap-4"
      action={async (formData) => {
        const result = await checkoutAction(formData);
        if (result && !result.ok) setMessage(result.message);
      }}
    >
      <fieldset className="grid gap-2">
        <legend className="font-semibold">Consegna</legend>
        <label><input type="radio" name="fulfillment" value="PICKUP" defaultChecked /> Ritiro in negozio</label>
        <label><input type="radio" name="fulfillment" value="SHIPPING" /> Spedizione</label>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="font-semibold">Pagamento</legend>
        <label><input type="radio" name="settlement" value="ONLINE" defaultChecked /> Paga ora online con carta</label>
        <label><input type="radio" name="settlement" value="PAY_AT_PICKUP" /> Paga in negozio al ritiro — in contanti o con carta</label>
      </fieldset>
      <label className="grid gap-2">Nota
        <textarea className="min-h-24 rounded-xl border border-line p-3" name="note" />
      </label>
      {message ? <p role="alert">{message}</p> : null}
      <button className="min-h-11 rounded-xl bg-teal px-5 text-white" type="submit">Conferma ordine</button>
    </form>
  );
}
