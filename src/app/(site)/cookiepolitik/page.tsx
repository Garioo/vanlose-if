import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cookiepolitik — Vanløse IF",
  description: "Læs hvordan Vanløse IF bruger cookies og lignende teknologier på hjemmesiden.",
  path: "/cookiepolitik",
});

export default function CookiepolitikPage() {
  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen pt-14">
      <section className="border-b border-[#e0dbd3] px-4 md:px-8 py-12 md:py-16 max-w-4xl mx-auto">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-4">COOKIEPOLITIK</h1>
        <p className="text-sm text-gray-600">
          Sidst opdateret: 12. marts 2026.
        </p>
      </section>

      <section className="px-4 md:px-8 py-12 md:py-16 max-w-4xl mx-auto space-y-10">
        <div>
          <h2 className="font-display text-2xl mb-3">1. Hvad er cookies?</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Cookies er små tekstfiler, som gemmes i din browser for at få hjemmesiden til at fungere,
            måle trafik og forbedre oplevelsen.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">2. Hvilke typer vi bruger</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Vi bruger nødvendige cookies til teknisk drift samt statistikværktøjer til at forstå,
            hvordan siden anvendes. Statistik bruges i aggregeret form til forbedringer af indhold og
            formularflows.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">3. Tredjepartsleverandører</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Vi kan anvende tredjepartstjenester til statistik og fejlsporing. Disse kan placere egne
            tekniske identifikatorer i overensstemmelse med deres databehandleraftaler.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">4. Sådan ændrer du samtykke</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Du kan altid slette eller blokere cookies i din browser. Vær opmærksom på, at dele af
            hjemmesiden kan fungere dårligere uden nødvendige cookies.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">5. Kontakt</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Har du spørgsmål om cookies eller databehandling, kontakt os på kontakt@vanlosif.dk.
          </p>
        </div>
      </section>
    </div>
  );
}
