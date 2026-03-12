import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Ungdom — Vanløse IF",
  description: "Vanløse IFs ungdomsafdeling. Børnefodbold, elite og træningstider for U5-U19.",
  path: "/ungdom",
});

const trainingTimes = [
  { group: "Børnefodbold (U5-U12)", schedule: "Man, Ons, Fre kl. 16:30" },
  { group: "Elite Ungdom (U13-U19)", schedule: "Alle hverdage kl. 17:00" },
  { group: "Målmandstræning", schedule: "Torsdag kl. 18:00" },
];

export default function UngdomPage() {
  return (
    <div className="bg-white text-black min-h-screen">
      {/* Hero */}
      <section className="pt-14 min-h-screen flex items-end relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 top-14 bg-gradient-to-b from-gray-900 to-black" />
        <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] mb-6 max-w-3xl">
            FREMTIDENS STJERNER
          </h1>
          <p className="text-sm text-gray-300 mb-8 max-w-md leading-relaxed">
            Vi bygger bro mellem fællesskab og sportslig udvikling i hjertet af Vanløse.
          </p>
          <a
            href="#tilmelding"
            className="inline-flex items-center gap-2 border border-white text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-white hover:text-black transition-colors"
          >
            BLIV MEDLEM
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "450+", label: "Aktive spillere" },
            { value: "35", label: "Uddannede trænere" },
            { value: "100%", label: "Fællesskab" },
            { value: "U5-U19", label: "Aldersgrupper" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl mb-1">{stat.value}</div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Børnefodbold */}
      <section id="bornefodbold" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
            <div className="absolute bottom-4 left-4 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
              Aldersgruppe U5-U12
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-6">BØRNEFODBOLD</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Her starter drømmen. For de yngste årgange handler fodbold i Vanløse IF om leg,
              bevægelse og nye venskaber. Vi følger DBU&apos;s retningslinjer for børnefodbold, hvor
              sjovt altid kommer før resultater.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                "Fokus på motorik og leg",
                "Trygge rammer og gode trænere",
                "Plads til alle uanset niveau",
              ].map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-1 h-1 bg-black rounded-full shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
            <a
              href="/kontakt"
              className="text-xs font-bold tracking-widest uppercase flex items-center gap-1 hover:underline"
            >
              LÆS MERE OM BØRNEAFDELINGEN
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Elite Ungdom */}
      <section id="elite" className="py-16 md:py-24 px-4 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-6">ELITE UNGDOM</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              For de spillere der vil have mere. Vores eliteprogram fokuserer på individuel teknisk
              udvikling, taktisk forståelse og fysisk træning. Vi skaber rammerne for, at de
              største talenter kan tage skridtet mod seniorfodbold på højt niveau.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { label: "Licenstræning", sub: "Struktureret elite-setup" },
                { label: "Udvikling", sub: "Individuelle forløb" },
              ].map((box) => (
                <div key={box.label} className="bg-white border border-gray-200 p-4">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">
                    {box.label}
                  </div>
                  <div className="text-xs text-gray-600">{box.sub}</div>
                </div>
              ))}
            </div>
            <a
              href="/forsteholdet"
              className="text-xs font-bold tracking-widest uppercase flex items-center gap-1 hover:underline"
            >
              SE VORES ELITE-SETUP
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="aspect-[4/3] bg-gray-200 overflow-hidden relative order-first md:order-last" />
        </div>
      </section>

      {/* Træningstider */}
      <section id="traening" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/2">
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-4">TRÆNINGSTIDER</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Find din årgang herunder og se hvornår vi træner på banerne ved Vanløse Idrætspark.
              Bemærk at tiderne kan variere mellem sommer- og vintersæson.
            </p>
          </div>
          <div className="md:w-1/2 w-full">
            <div className="divide-y divide-gray-200 mb-6">
              {trainingTimes.map((row) => (
                <div key={row.group} className="flex justify-between items-center py-4">
                  <span className="text-xs font-bold uppercase tracking-wide">{row.group}</span>
                  <span className="text-xs text-gray-500">{row.schedule}</span>
                </div>
              ))}
            </div>
            <a
              href="/kontakt"
              className="inline-block bg-black text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-gray-900 transition-colors"
            >
              DOWNLOAD FULD OVERSIGT
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="tilmelding" className="py-20 md:py-32 px-4 md:px-8 bg-black text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-5xl md:text-7xl leading-[0.9] mb-6">
            KLAR TIL AT SPILLE?
          </h2>
          <p className="text-sm text-gray-400 italic mb-10">
            &ldquo;I Vanløse IF er vi mere end bare en klub – vi er en familie.&rdquo;
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/bliv-medlem"
              className="inline-block bg-white text-black text-xs font-bold tracking-widest uppercase px-8 py-4 hover:bg-gray-100 transition-colors"
            >
              TILMELD DIG NU
            </a>
            <a
              href="/kontakt"
              className="inline-block border border-white text-white text-xs font-bold tracking-widest uppercase px-8 py-4 hover:bg-white/10 transition-colors"
            >
              PRØVETRÆNING
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
