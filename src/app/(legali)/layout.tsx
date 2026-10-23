export const instant = false;

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="rounded-xl border border-gold bg-white p-4"><strong>Bozza.</strong> Questo testo va revisionato da un professionista prima della produzione. Non è un documento legale definitivo.</p>
      {children}
    </main>
  );
}
