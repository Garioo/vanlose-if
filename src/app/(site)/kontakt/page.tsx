import type { Metadata } from "next";
import KontaktForm from "@/components/KontaktForm";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Kontakt — Vanløse IF",
  description: "Kontakt Vanløse IF med spørgsmål om medlemskab, sponsorater eller andet.",
  path: "/kontakt",
});

export default function KontaktPage() {
  return (
    <div className="bg-white text-black min-h-screen pt-14">
      {/* Hero */}
      <section className="border-b border-gray-200 px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        <h1 className="font-display text-5xl md:text-7xl leading-[0.9] mb-3">KONTAKT OS</h1>
        <p className="text-sm text-gray-600 max-w-md">
          Har du spørgsmål om medlemskab, sponsorater eller andet? Vi svarer inden for 1-2 hverdage.
        </p>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
          {/* Contact info */}
          <div>
            <h2 className="font-display text-2xl mb-8">FIND OS</h2>
            <div className="space-y-6">
              {[
                { label: "Adresse", lines: ["Klampegårdsvej 4-6", "2720 Vanløse"] },
                { label: "E-mail", lines: ["kontakt@vanlosif.dk"] },
                { label: "Telefon", lines: ["+45 38 74 12 12"] },
                { label: "Sekretariat åbningstider", lines: ["Mandag – torsdag: 16:00 – 19:00", "Lørdag: 10:00 – 13:00"] },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
                    {item.label}
                  </p>
                  {item.lines.map((line) => (
                    <p key={line} className="text-sm text-gray-700">{line}</p>
                  ))}
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="mt-10 bg-gray-100 aspect-video relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-3 h-3 bg-black rounded-full mx-auto mb-2" />
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                    Klampegårdsvej 4-6, Vanløse
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <KontaktForm />
        </div>
      </section>
    </div>
  );
}
