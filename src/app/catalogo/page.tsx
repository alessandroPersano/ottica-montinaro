import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Money, Panel } from "@/components/ui";
import { listBrands, listPublicProducts, type CatalogFilters } from "@/server/catalog";
import { firstParam } from "@/lib/utils";
import { connection } from "next/server";

export const metadata: Metadata = { title: "Lenti a contatto", description: "Catalogo lenti a contatto di Ottica Montinaro a Calimera." };
export const instant = false;

export default function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1>Lenti a contatto</h1>
      <p>Filtra per marca, ricambio e geometria. I prezzi sono IVA inclusa.</p>
      <Suspense fallback={<p>Caricamento catalogo…</p>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalog({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const params = await searchParams;
  const filters: CatalogFilters = {
    q: firstParam(params.q),
    brand: firstParam(params.marca),
    type: firstParam(params.tipo),
    geometry: firstParam(params.geometria),
    availability: firstParam(params.disponibilita),
    min: firstParam(params.min),
    max: firstParam(params.max),
  };
  const [products, brands] = await Promise.all([listPublicProducts(filters), listBrands()]);
  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <form className="grid gap-3" method="get">
        <label>Cerca<input className="min-h-11 w-full" name="q" defaultValue={filters.q} /></label>
        <label>Marca
          <select className="min-h-11 w-full" name="marca" defaultValue={filters.brand ?? ""}>
            <option value="">Tutte</option>
            {brands.map((brand) => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}
          </select>
        </label>
        <label>Ricambio
          <select className="min-h-11 w-full" name="tipo" defaultValue={filters.type ?? ""}>
            <option value="">Tutti</option>
            <option value="DAILY">Giornaliera</option>
            <option value="BIWEEKLY">Quindicinale</option>
            <option value="MONTHLY">Mensile</option>
            <option value="RIGID">Rigida</option>
            <option value="OTHER">Altra</option>
          </select>
        </label>
        <label>Geometria
          <select className="min-h-11 w-full" name="geometria" defaultValue={filters.geometry ?? ""}>
            <option value="">Tutte</option>
            <option value="SPHERICAL">Sferica</option>
            <option value="TORIC">Torica</option>
            <option value="MULTIFOCAL">Multifocale</option>
            <option value="COSMETIC">Cosmetica</option>
          </select>
        </label>
        <label>Disponibilità
          <select className="min-h-11 w-full" name="disponibilita" defaultValue={filters.availability ?? ""}>
            <option value="">Tutte</option>
            <option value="disponibile">Disponibili</option>
          </select>
        </label>
        <label>Prezzo minimo €<input className="min-h-11 w-full" name="min" inputMode="decimal" defaultValue={filters.min} /></label>
        <label>Prezzo massimo €<input className="min-h-11 w-full" name="max" inputMode="decimal" defaultValue={filters.max} /></label>
        <button className="min-h-11 rounded-xl bg-teal text-white" type="submit">Applica filtri</button>
      </form>
      <div className="grid gap-4">
        {products.length === 0 ? <Panel><h2>Nessuna lente con questi filtri</h2><p>Prova ad allargarli o passa in negozio.</p></Panel> : null}
        {products.map((product) => (
          <Panel key={product.id}>
            <p className="text-sm text-muted">{product.brandName}</p>
            <h2 className="mt-1"><Link href={`/prodotto/${product.slug}`}>{product.commercialName}</Link></h2>
            <p>{product.shortDescription}</p>
            <p><Money cents={product.priceCents} /></p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
