import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import SiteImage from "@/components/SiteImage";

// Næsten statisk indhold. Siden genopbygges højst hvert 300. sekund i stedet for ved
// hver eneste anmodning; live-resultater ligger i kampcenteret, som stadig
// er dynamisk.
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: "Klubben — Vanløse IF",
  description: "Lær Vanløse IF at kende. Historie, værdier, vedtægter og bestyrelse siden 1921.",
  path: "/klubben",
});

const eras = [
  {
    period: "1921 — 1950",
    title: "DE FØRSTE ÅR",
    description:" Grundlæggelsen af Vanløse IF og de første årtiers udvikling.",
    imageKey: "klubben_era_1_image",
  },
  {
    period: "1951 — 1990",
    title: "GULDALDEREN",
    description:
      "Oprykninger og guldmedaljer. Klubbens mest succesrige årtier.",
    imageKey: "klubben_era_2_image",
  },
  {
    period: "1991 — NU",
    title: "MODERNE TID",
    description:
      "Nye faciliteter, mere professionel drift og en voksende ungdomsafdeling.",
    imageKey: "klubben_era_3_image",
  },
];

export default async function KlubbenPage() {
  // Fetch only the keys this page renders — the era keys are derived from the
  // list above so a new era can't silently lose its image.
  const { data: settingsData } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["klubben_hero_image", ...eras.map((era) => era.imageKey)]);

  const settingsMap = Object.fromEntries((settingsData ?? []).map((s) => [s.key, s.value]));
  const heroImage = settingsMap["klubben_hero_image"];

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen">
      {/* Hero */}
      <section className="pt-14 min-h-screen flex items-end bg-black text-white overflow-hidden relative">
        {heroImage && (
          <SiteImage src={heroImage} alt="" aria-hidden width={1600} sizes="100vw" priority className="object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-black/40 to-black" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-20">
          <div className="max-w-lg">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
              Etableret 1921
            </p>
            <h1 className="font-display text-7xl md:text-9xl leading-[0.85] mb-6">
              KLUBBEN<span className="text-gray-500">.</span>
            </h1>
            <p className="text-sm text-gray-300 max-w-md leading-relaxed">
              Fodbold i Vanløse siden 1921 — fra de yngste årgange til førsteholdet.
            </p>
          </div>
        </div>
      </section>

      {/* Arkiv & Historie */}
      <section id="arkiv" className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-10 gap-6">
          <h2 className="font-display text-4xl md:text-6xl leading-[0.9] reveal">
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
          {eras.map((era, i) => {
            const imageUrl = settingsMap[era.imageKey];
            const delayClass = i === 0 ? "reveal reveal-delay-1" : i === 1 ? "reveal reveal-delay-2" : "reveal reveal-delay-3";
            return (
              <div key={era.title} className={`group cursor-pointer ${delayClass}`}>
                <div className="relative aspect-[4/3] bg-[#edeae3] mb-4 overflow-hidden">
                  {imageUrl ? (
                    <SiteImage
                      src={imageUrl}
                      alt={era.title}
                      width={600}
                      sizes={"(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#ddd8d0] to-[#ccc6bc] group-hover:from-[#ccc6bc] group-hover:to-[#bbb5ab] transition-colors duration-300" />
                  )}
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] mb-1">
                  {era.period}
                </p>
                <h3 className="font-display text-xl font-bold mb-2">{era.title}</h3>
                <p className="text-xs text-[#6b6560] leading-relaxed">{era.description}</p>
              </div>
            );
          })}
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
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.9] md:w-2/3 reveal">
                FÆLLESSKAB FREM FOR ALT
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed md:w-1/3 md:pt-2">
                Vi lægger vægt på, at spillere kender hinanden på tværs af årgange, og at der er
                plads til både bredde og elite.
              </p>
            </div>
            <div className="py-10 md:py-14 flex flex-col md:flex-row md:items-start gap-6">
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.9] md:w-2/3 reveal">
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
