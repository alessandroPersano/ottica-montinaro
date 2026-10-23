import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSession, roleOf } from "@/server/guard";
import { getSettings } from "@/server/settings";

const links = [
  { href: "/catalogo", label: "Lenti a contatto" },
  { href: "/abbonamento", label: "Abbonamento" },
  { href: "/contatti", label: "Contatti" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="no-underline">
          <span className="block font-serif text-2xl text-teal">Ottica Montinaro</span>
          <span className="text-sm text-muted">Calimera · dal 1984</span>
        </Link>
        <nav aria-label="Principale" className="flex flex-wrap items-center gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="no-underline text-foreground">
              {link.label}
            </Link>
          ))}
          <Link href="/carrello" className="no-underline text-foreground">Carrello</Link>
          <Suspense fallback={<Link href="/accesso">Accedi</Link>}>
            <AccountLink />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function AccountLink() {
  await connection();
  const session = await getSession();
  if (!session) return <Link href="/accesso">Accedi</Link>;
  const role = roleOf(session);
  const href = role === "CUSTOMER" ? "/area-personale" : "/admin";
  return <Link href={href}>Area personale</Link>;
}

export async function SiteFooter() {
  await connection();
  const settings = await getSettings();
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl">Ottica Montinaro</p>
          <p>{settings.pickupAddress}</p>
          {settings.supportPhone ? <p><a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`}>{settings.supportPhone}</a></p> : null}
          <p>{settings.storeHours ?? "Orari in aggiornamento: chiama per conferma."}</p>
        </div>
        <div>
          <p className="font-semibold">Informazioni</p>
          <ul className="list-none p-0">
            <li><Link href="/spedizioni-e-ritiro">Spedizioni, ritiro e resi</Link></li>
            <li><Link href="/condizioni-di-vendita">Condizioni di vendita</Link></li>
            <li><Link href="/termini">Termini e condizioni</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Privacy</p>
          <ul className="list-none p-0">
            <li><Link href="/privacy">Informativa privacy</Link></li>
            <li><Link href="/cookie">Cookie policy</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
