"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Field, inputClass } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await authClient.signIn.email({
          email: String(data.get("email") ?? ""),
          password: String(data.get("password") ?? ""),
        });
        if (result.error) {
          const raw = result.error.message ?? "";
          setMessage(/invalid email or password/i.test(raw)
            ? "Email o password non corretti."
            : raw || "Accesso non riuscito. Controlla email e password, oppure conferma l'indirizzo.");
          return;
        }
        const role = (result.data?.user as { role?: string } | undefined)?.role;
        router.push(role === "ADMIN" || role === "OPERATOR" ? "/admin" : "/area-personale");
        router.refresh();
      }}
    >
      <Field label="Email"><input className={inputClass} name="email" type="email" required autoComplete="email" /></Field>
      <Field label="Password"><input className={inputClass} name="password" type="password" required autoComplete="current-password" /></Field>
      {message ? <p role="alert">{message}</p> : null}
      <button className="min-h-11 rounded-xl bg-teal px-5 text-white" type="submit">Entra</button>
    </form>
  );
}
