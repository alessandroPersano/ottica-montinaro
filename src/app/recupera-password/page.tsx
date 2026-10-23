"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Field, inputClass } from "@/components/ui";

export default function RecoverPage() {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1>Recupera la password</h1>
      <form className="grid gap-4" onSubmit={async (event) => {
        event.preventDefault();
        const email = String(new FormData(event.currentTarget).get("email") ?? "");
        const result = await authClient.requestPasswordReset({ email, redirectTo: "/reimposta-password" });
        setMessage(result.error ? "Se l'indirizzo è registrato riceverai un messaggio." : "Se l'indirizzo è registrato riceverai un messaggio.");
      }}>
        <Field label="Email"><input className={inputClass} name="email" type="email" required /></Field>
        <button className="min-h-11 rounded-xl bg-teal text-white" type="submit">Invia il link</button>
        {message ? <p role="status">{message}</p> : null}
      </form>
    </main>
  );
}
