"use client";

import { useState } from "react";
import { collectInStore, moveOrder } from "@/app/actions/admin";

export function OrderActions({ orderId, amountCents, due }: { orderId: string; amountCents: number; due: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const idempotencyKey = `${orderId}-incasso`;
  return (
    <div className="grid gap-6">
      {due ? (
        <form className="grid gap-3" action={async (formData) => {
          const result = await collectInStore(formData);
          setMessage(result.message);
        }}>
          <h2>Registra incasso al ritiro</h2>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="amountCents" value={amountCents} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <label>Metodo
            <select className="min-h-11 w-full" name="method">
              <option value="CASH">Contanti</option>
              <option value="IN_STORE_CARD">Carta / POS</option>
            </select>
          </label>
          <label>Riferimento scontrino o POS<input className="min-h-11 w-full" name="receiptReference" /></label>
          <label>Nota interna<input className="min-h-11 w-full" name="note" /></label>
          <button className="min-h-11 rounded-xl bg-teal text-white" type="submit">Registra incasso</button>
        </form>
      ) : null}
      <form className="grid gap-3" action={async (formData) => {
        const result = await moveOrder(formData);
        setMessage(result.message);
      }}>
        <h2>Aggiorna stato</h2>
        <input type="hidden" name="orderId" value={orderId} />
        <select className="min-h-11" name="to">
          <option value="CONFIRMED">Confermato</option>
          <option value="ORDERED_FROM_SUPPLIER">Ordinato al fornitore</option>
          <option value="READY_FOR_PICKUP">Pronto per il ritiro</option>
          <option value="SHIPPED">Spedito</option>
          <option value="DELIVERED">Consegnato</option>
          <option value="CANCELLED">Annullato</option>
        </select>
        <label>Nota<input className="min-h-11 w-full" name="note" /></label>
        <label>Override amministratore, obbligatorio solo se consegni con saldo dovuto
          <input className="min-h-11 w-full" name="override" />
        </label>
        <button className="min-h-11 rounded-xl border border-line" type="submit">Salva stato</button>
      </form>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
