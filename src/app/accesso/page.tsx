import type { Metadata } from "next";
export const instant = false;
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { Panel } from "@/components/ui";

export const metadata: Metadata = { title: "Accesso" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registrato?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1>Accedi</h1>
      {params.registrato ? <p role="status">Account creato. Conferma l&apos;email se ti è stato chiesto, poi entra.</p> : null}
      <Panel><LoginForm /></Panel>
      <p><Link href="/registrazione">Non hai un account? Registrati</Link></p>
      <p><Link href="/recupera-password">Hai dimenticato la password?</Link></p>
    </main>
  );
}
