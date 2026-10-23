import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ButtonLink, Money, Panel } from "@/components/ui";
import { listPublicProducts } from "@/server/catalog";

export const instant = false;

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Optician",
    name: "Ottica Montinaro",
    address: { "@type": "PostalAddress", streetAddress: "Via Roma 14", postalCode: "73021", addressLocality: "Calimera", addressRegion: "LE", addressCountry: "IT" },
    telephone: "0832 873284",
    foundingDate: "1984",
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-gold">Ottica, optometria e contattologia</p>
          <h1 className="text-4xl md:text-6xl">Dal 1984 ci prendiamo cura della tua vista.</h1>
          <p className="max-w-xl text-xl">
            Scegliamo le lenti a contatto adatte alla tua configurazione, le prepariamo in negozio a Calimera
            e ti avvisiamo prima che finiscano. La configurazione online non è una diagnosi: la verifica resta nostra.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/catalogo">Vedi le lenti</ButtonLink>
            <ButtonLink href="/abbonamento" variant="ghost">Come funziona l&apos;abbonamento</ButtonLink>
          </div>
        </div>
        <Panel>
          <h2 className="mt-0">In negozio o a casa</h2>
          <ul>
            <li>Ritiro in Via Roma 14, con pagamento online oppure in negozio, in contanti o con carta.</li>
            <li>Spedizione con soglia di gratuità configurabile.</li>
            <li>Abbonamento con carta, anche se ritiri in negozio.</li>
          </ul>
        </Panel>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2>Alcune lenti disponibili</h2>
        <Suspense fallback={<p>Caricamento del catalogo…</p>}>
          <Highlights />
        </Suspense>
        <p><Link href="/catalogo">Apri il catalogo completo</Link></p>
      </section>
    </main>
  );
}

async function Highlights() {
  await connection();
  const products = await listPublicProducts({});
  if (products.length === 0) {
    return <p>Il catalogo è in preparazione. Passa in negozio o chiamaci.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {products.slice(0, 3).map((product) => (
        <Panel key={product.id}>
          <p className="text-sm text-muted">{product.brandName}</p>
          <h3 className="mt-1">{product.commercialName}</h3>
          <p>{product.shortDescription}</p>
          <p className="font-semibold"><Money cents={product.priceCents} /></p>
          <Link href={`/prodotto/${product.slug}`}>Scheda prodotto</Link>
        </Panel>
      ))}
    </div>
  );
}
