import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { addToCart } from "@/app/actions/shop";
import { Money, Panel } from "@/components/ui";
import { getProductBySlug } from "@/server/catalog";

export const instant = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replaceAll("-", " ") };
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<main className="p-8">Caricamento scheda…</main>}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data || data.product.status === "UNAVAILABLE") notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.product.commercialName,
    description: data.product.shortDescription,
    sku: data.product.sku,
    brand: data.brand.name,
    offers: { "@type": "Offer", priceCurrency: "EUR", price: (data.product.priceCents / 100).toFixed(2), availability: "https://schema.org/InStock" },
  };
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <img src={data.images[0]?.path ?? "/images/products/giornaliera.svg"} alt={data.images[0]?.alt ?? ""} className="w-full rounded-2xl border border-line bg-white" />
      <div>
        <p className="text-muted">{data.brand.name}</p>
        <h1>{data.product.commercialName}</h1>
        <p className="text-2xl"><Money cents={data.product.priceCents} /></p>
        <p>{data.product.description}</p>
        <Panel>
          <form action={addToCart} className="grid gap-3">
            <input type="hidden" name="productId" value={data.product.id} />
            <label>Occhio
              <select className="min-h-11 w-full" name="eye">
                <option value="RIGHT">Destro</option>
                <option value="LEFT">Sinistro</option>
              </select>
            </label>
            <label>Confezioni
              <input className="min-h-11 w-full" name="quantity" type="number" min={1} max={12} defaultValue={1} />
            </label>
            <button className="min-h-11 rounded-xl bg-teal text-white" type="submit">Aggiungi al carrello</button>
          </form>
          <p>Se non hai ancora un account, ti chiederemo di entrare. La configurazione clinica si associa dopo, e va verificata prima dell&apos;evasione.</p>
        </Panel>
      </div>
    </main>
  );
}
