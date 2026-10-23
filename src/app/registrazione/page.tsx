import type { Metadata } from "next";
export const instant = false;
import { RegisterForm } from "@/components/register-form";
import { Panel } from "@/components/ui";

export const metadata: Metadata = { title: "Registrazione" };

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1>Crea il tuo account</h1>
      <p>Ti chiediamo solo i dati necessari per ordini e promemoria. La configurazione delle lenti, se la inserisci, viene verificata da noi.</p>
      <Panel>
        <RegisterForm />
      </Panel>
    </main>
  );
}
