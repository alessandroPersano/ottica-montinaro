import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paths = ["", "/catalogo", "/abbonamento", "/contatti", "/privacy", "/cookie", "/termini", "/condizioni-di-vendita", "/spedizioni-e-ritiro", "/accesso", "/registrazione"];
  return paths.map((path) => ({ url: `${base}${path || "/"}`, changeFrequency: "weekly" }));
}
