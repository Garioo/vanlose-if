import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privatlivspolitik — Vanløse IF",
  description:
    "Læs hvordan Vanløse IF behandler personoplysninger, herunder kontakt-, frivillig- og nyhedsbrevsdata.",
  path: "/privatlivspolitik",
});

export default function PrivatlivspolitikPage() {
  return (
    <div className="bg-white text-black min-h-screen pt-14">
      <section className="border-b border-gray-200 px-4 md:px-8 py-12 md:py-16 max-w-4xl mx-auto">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-4">PRIVATLIVSPOLITIK</h1>
        <p className="text-sm text-gray-600">
          Sidst opdateret: 12. marts 2026.
        </p>
      </section>

      <section className="px-4 md:px-8 py-12 md:py-16 max-w-4xl mx-auto space-y-10">
        <div>
          <h2 className="font-display text-2xl mb-3">1. Dataansvarlig</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Vanløse IF er dataansvarlig for behandlingen af personoplysninger på dette website.
            Kontakt: kontakt@vanlosif.dk.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">2. Hvilke data vi indsamler</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Vi indsamler oplysninger, du selv indtaster i formularer: navn, e-mail, emne/besked og
            frivilligrolle. Ved nyhedsbrev gemmer vi e-mail. Vi gemmer ikke følsomme persondata via
            de offentlige formularer.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">3. Formål og retsgrundlag</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Oplysninger behandles for at besvare henvendelser, håndtere frivilligtilmeldinger og
            administrere nyhedsbrev. Retsgrundlaget er legitim interesse og/eller samtykke afhængigt
            af henvendelsestype.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">4. Opbevaring og sletning</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Vi opbevarer data så længe det er nødvendigt for formålet. Henvendelser og
            frivilligtilmeldinger gennemgås løbende og slettes, når de ikke længere er relevante.
            Nyhedsbrev kan til enhver tid afmeldes.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">5. Databehandlere</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Website og formularoplysninger hostes via Supabase som databehandler. Vi anvender også
            tekniske leverandører til drift, fejlsøgning og statistik.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">6. Dine rettigheder</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Du kan anmode om indsigt, berigtigelse, sletning, begrænsning og dataportabilitet samt
            gøre indsigelse mod behandling. Kontakt os på kontakt@vanlosif.dk.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-3">7. Klage</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Du kan klage til Datatilsynet, hvis du er utilfreds med vores behandling af
            personoplysninger.
          </p>
        </div>
      </section>
    </div>
  );
}
