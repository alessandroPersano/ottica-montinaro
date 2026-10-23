"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="it">
      <body style={{ fontFamily: "Georgia, serif", padding: "2rem" }}>
        <h1>Errore imprevisto</h1>
        <p>Ricarica la pagina. Se continua, chiamaci in negozio.</p>
        <button type="button" onClick={() => reset()}>Riprova</button>
      </body>
    </html>
  );
}
