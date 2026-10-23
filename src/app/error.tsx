"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1>Qualcosa non ha funzionato</h1>
      <p>Non siamo riusciti a completare la richiesta. Puoi riprovare.</p>
      <button className="min-h-11 rounded-xl bg-teal px-5 text-white" type="button" onClick={() => reset()}>Riprova</button>
    </main>
  );
}
