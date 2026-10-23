import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1>Pagina non trovata</h1>
      <p>Il collegamento non corrisponde a una pagina del sito.</p>
      <p><Link href="/">Torna alla home</Link></p>
    </main>
  );
}
