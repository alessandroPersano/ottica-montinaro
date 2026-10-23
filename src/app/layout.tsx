import type { Metadata } from "next";
export const instant = false;
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-ext-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import "@fontsource/source-sans-3/latin-ext-600.css";
import "@fontsource/source-serif-4/latin-600.css";
import "@fontsource/source-serif-4/latin-ext-600.css";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Ottica Montinaro", template: "%s · Ottica Montinaro" },
  description: "Lenti a contatto, ritiro in negozio a Calimera e abbonamenti. Dal 1984.",
  openGraph: { locale: "it_IT", siteName: "Ottica Montinaro", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it">
      <body className="min-h-screen">
        <a className="skip-link" href="#contenuto">Vai al contenuto</a>
        <SiteHeader />
        <div id="contenuto">{children}</div>
        <Suspense fallback={<footer className="p-8">Ottica Montinaro</footer>}>
          <SiteFooter />
        </Suspense>
      </body>
    </html>
  );
}
