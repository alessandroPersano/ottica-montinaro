"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { Field, inputClass } from "@/components/ui";

export default function ResetPage() {
  return (
    <Suspense fallback={<main className="p-8">Caricamento…</main>}>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const params = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1>Nuova password</h1>
      <form className="grid gap-4" onSubmit={async (event) => {
        event.preventDefault();
        const password = String(new FormData(event.currentTarget).get("password") ?? "");
        const token = params.get("token") ?? "";
        const result = await authClient.resetPassword({ newPassword: password, token });
        setMessage(result.error ? "Il link non è valido o è scaduto." : "Password aggiornata. Ora puoi entrare.");
      }}>
        <Field label="Nuova password"><input className={inputClass} name="password" type="password" minLength={10} required /></Field>
        <button className="min-h-11 rounded-xl bg-teal text-white" type="submit">Salva</button>
        {message ? <p role="status">{message}</p> : null}
      </form>
    </main>
  );
}
