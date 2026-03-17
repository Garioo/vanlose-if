import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";
import Link from "next/link";

export const metadata: Metadata = buildPageMetadata({
  title: "Klubben — Vanløse IF",
  description: "Lær Vanløse IF at kende. Historie, værdier, vedtægter og bestyrelse siden 1921.",
  path: "/klubben",
});

const eras = [
  {
    period: "1921 — 1950",
    title: "DE FØRSTE ÅR",
    description:
      "Grundlæggelsen af en institution. Fra beskedne forhold på Vanløse Idrætspark til en klub med ambitioner.",
  },
  {
    period: "1951 — 1990",
    title: "GULDALDEREN",
    description:
      "De store årtier. Oprykning, guldmedaljer og et fællesskab, der bandt generationer af vanløsitter sammen.",
  },
  {
    period: "1991 — NU",
    title: "MODERNE TID",
    description:
      "Ny infrastruktur, professionalisering og en ungdomsafdeling i verdensklasse. Fremtiden tilhører VIF.",
  },
];

export default function KlubbenPage() {
  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen">
      {/* Hero */}
      <section className="pt-14 min-h-screen flex items-end bg-black text-white overflow-hidden">
        <div className="absolute inset-0 top-14 bg-gradient-to-b from-gray-900 to-black" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-20 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-lg">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
              Etableret 1921
            </p>
            <h1 className="font-display text-7xl md:text-9xl leading-[0.85] mb-6">
              KLUBBEN<span className="text-gray-500">.</span>
            </h1>
            <p className="text-sm text-gray-300 max-w-md leading-relaxed">
              En arv bygget på fællesskab, passion og sort/hvid stolthed. Siden 1921 har vi formet
              generationer af fodboldspillere i hjertet af Vanløse.
            </p>
          </div>

          {/* Stacked image placeholders */}
          <div className="flex flex-col gap-2 w-full md:w-64 flex-shrink-0">
            {["bg-gray-700", "bg-gray-600", "bg-gray-500"].map((bg, i) => (
              <div key={i} className={`${bg} h-24 w-full`} />
            ))}
          </div>
        </div>
      </section>

      {/* Arkiv & Historie */}
      <section id="arkiv" className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-10 gap-6">
          <h2 className="font-display text-4xl md:text-6xl leading-[0.9]">
            ARKIV & HISTORIE
          </h2>
          <div className="md:max-w-xs">
            <p className="text-sm text-[#4a4540] mb-4">
              Udforsk de øjeblikke, der definerede os. Fra de tidlige dage i 20erne til moderne triumfer.
            </p>
            <Link
              href="/nyheder"
              className="text-xs font-bold tracking-widest uppercase flex items-center gap-1 hover:underline"
            >
              SE DET FULDE ARKIV
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {eras.map((era) => (
            <div key={era.title} className="group cursor-pointer">
              <div className="aspect-[4/3] bg-[#edeae3] mb-4 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#ddd8d0] to-[#ccc6bc] group-hover:from-[#ccc6bc] group-hover:to-[#bbb5ab] transition-colors duration-300" />
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-1">
                {era.period}
              </p>
              <h3 className="font-display text-xl font-bold mb-2">{era.title}</h3>
              <p className="text-xs text-[#6b6560] leading-relaxed">{era.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vores Grundlag */}
      <section id="vores-grundlag" className="py-16 md:py-24 px-4 md:px-8 bg-[#141412] text-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#5a5550] mb-12">
            VORES GRUNDLAG
          </p>
          <div className="space-y-0 divide-y divide-white/10">
            <div className="py-10 md:py-14 flex flex-col md:flex-row md:items-start gap-6">
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.9] md:w-2/3">
                FÆLLESSKAB FREM FOR ALT
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed md:w-1/3 md:pt-2">
                Vanløse IF er mere end blot en klub; vi er en familie. Vi dyrker relationer på tværs
                af årgange og sikrer, at alle føler sig hjemme i de sort/hvide farver.
              </p>
            </div>
            <div className="py-10 md:py-14 flex flex-col md:flex-row md:items-start gap-6">
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.9] md:w-2/3">
                UDVIKLING & RESPEKT
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed md:w-1/3 md:pt-2">
                Vi stræber efter sportslig excellence, men aldrig på bekostning af respekten for
                spillet, modstanderen eller hinanden. Dannelse følger bolden.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="vedtaegter" className="py-16 md:py-24 px-4 md:px-8 border-t border-[#e0dbd3]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-2/3">
            <h2 className="font-display text-3xl md:text-4xl leading-tight mb-4">
              DOKUMENTER & KONTAKT
            </h2>
            <p className="text-sm text-[#4a4540] max-w-2xl">
              Officielle dokumenter og praktiske kluboplysninger bliver løbende samlet digitalt.
              Har du brug for aktuelle vedtægter, referater eller kontakt til den rette funktion,
              hjælper vi dig videre via sekretariatet.
            </p>
          </div>
          <div className="md:w-1/3 space-y-3">
            <Link
              href="/kontakt"
              className="block border border-black bg-black px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-900"
            >
              Kontakt Klubben
            </Link>
            <Link
              href="/privatlivspolitik"
              className="block border border-[#e0dbd3] px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-[#edeae3]"
            >
              Se Privatlivspolitik
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
