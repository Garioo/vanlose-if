import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";

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

const boardMembers = [
  { name: "Erik Hansen", role: "Formand", email: "eh@vanlosif.dk" },
  { name: "Karen Jensen", role: "Næstformand", email: "kj@vanlosif.dk" },
  { name: "Morten Nielsen", role: "Kasserer", email: "mn@vanlosif.dk" },
  { name: "Søren Bruun", role: "Bestyrelsesmedlem", email: "sb@vanlosif.dk" },
];

const documents = [
  { num: "01", title: "Klubbens Vedtægter 2024" },
  { num: "02", title: "Privatlivspolitik & GDPR" },
  { num: "03", title: "Børne- og Ungepolitik" },
  { num: "04", title: "Årsregnskab 2023" },
];

export default function KlubbenPage() {
  return (
    <div className="bg-white text-black min-h-screen">
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
            <p className="text-sm text-gray-600 mb-4">
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
              <div className="aspect-[4/3] bg-gray-100 mb-4 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-gray-300 group-hover:to-gray-400 transition-colors duration-300" />
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
                {era.period}
              </p>
              <h3 className="font-display text-xl font-bold mb-2">{era.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{era.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vores Grundlag */}
      <section id="vores-grundlag" className="py-16 md:py-24 px-4 md:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-12">
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

      {/* Vedtægter & Dokumenter */}
      <section id="vedtaegter" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
          <div className="md:w-1/3">
            <h2 className="font-display text-3xl md:text-4xl leading-tight mb-4">
              VEDTÆGTER & DOKUMENTER
            </h2>
            <p className="text-sm text-gray-600">
              Gennemsigtighed er fundamentet for vores klubdrift. Her finder du alle officielle
              dokumenter, referater og vedtægter.
            </p>
          </div>
          <div className="md:w-2/3 divide-y divide-gray-200">
            {documents.map((doc) => (
              <Link
                key={doc.num}
                href="/kontakt"
                className="flex items-center justify-between py-4 group hover:bg-gray-50 px-2 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-gray-400 w-6">{doc.num}</span>
                  <span className="text-sm font-bold uppercase tracking-wide">{doc.title}</span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400 group-hover:text-black transition-colors"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestyrelsen */}
      <section id="bestyrelse" className="py-16 md:py-24 px-4 md:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl md:text-6xl leading-[0.9] mb-12">BESTYRELSEN</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {boardMembers.map((member) => (
              <div key={member.name} className="group">
                <div className="aspect-[3/4] bg-gray-800 mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-800 group-hover:from-gray-600 transition-colors duration-300" />
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">
                  {member.role}
                </p>
                <h3 className="font-bold text-sm uppercase tracking-wide mb-1">{member.name}</h3>
                <p className="text-[10px] text-gray-500">{member.email}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
