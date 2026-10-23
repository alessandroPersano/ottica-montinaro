"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { registerAccount } from "@/app/actions/auth";
import { Field, inputClass } from "@/components/ui";
import { MARKETING_CONSENT_LABEL } from "@/domain/privacy";

export function RegisterForm() {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-4"
      action={async (formData) => {
        const result = await registerAccount(formData);
        if (result && !result.ok) setMessage(result.message);
      }}
    >
      <Field label="Nome e cognome"><input className={inputClass} name="name" required autoComplete="name" /></Field>
      <Field label="Email"><input className={inputClass} name="email" type="email" required autoComplete="email" /></Field>
      <Field label="Password"><input className={inputClass} name="password" type="password" required minLength={10} autoComplete="new-password" /></Field>
      <label className="flex items-start gap-3">
        <input className="mt-1 h-5 w-5" type="checkbox" name="privacyAccepted" />
        <span>
          Dichiaro di aver letto e compreso l&apos;{" "}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer">Informativa Privacy</Link>.
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input className="mt-1 h-5 w-5" type="checkbox" name="marketingAccepted" />
        <span>{MARKETING_CONSENT_LABEL}</span>
      </label>
      {message ? <p role="alert" className="text-danger">{message}</p> : null}
      <Submit />
    </form>
  );
}

function Submit() {
  const status = useFormStatus();
  return <button className="min-h-11 rounded-xl bg-teal px-5 text-white" disabled={status.pending}>{status.pending ? "Creazione…" : "Crea l'account"}</button>;
}
