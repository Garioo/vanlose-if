import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/metadata";
import HeroEnterWrapper from "@/components/HeroEnterWrapper";
import { supabase } from "@/lib/supabase";
import type { YouthTeam } from "@/lib/supabase";

export const metadata: Metadata = buildPageMetadata({
  title: "Ungdom — Vanløse IF",
  description: "Vanløse IFs ungdomsafdeling. Børnefodbold, elite og træningstider for U5-U19.",
  path: "/ungdom",
});

export default async function UngdomPage() {
  const [{ data }, { data: settingsData }] = await Promise.all([
    supabase.from("youth_teams").select("*").order("display_order", { ascending: true }),
    supabase.from("site_settings").select("key, value").in("key", ["ungdom_hero_image", "ungdom_bornefodbold_image", "ungdom_elite_image"]),
  ]);

  const settingsMap = Object.fromEntries((settingsData ?? []).map((s) => [s.key, s.value]));
  const youthTeams: YouthTeam[] = data ?? [];

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen">
      {/* Hero */}
      <section className="pt-14 min-h-screen flex items-end relative overflow-hidden bg-black text-white">
        {settingsMap["ungdom_hero_image"] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settingsMap["ungdom_hero_image"]} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
        <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-16 md:pb-24">
          <HeroEnterWrapper>
            <h1 className="hero-title font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] mb-6 max-w-3xl">
              FREMTIDENS STJERNER
            </h1>
            <p className="hero-body text-sm text-gray-300 mb-8 max-w-md leading-relaxed">
              Vi bygger bro mellem fællesskab og sportslig udvikling i hjertet af Vanløse.
            </p>
            <a
              href="#tilmelding"
              className="hero-cta inline-flex items-center gap-2 border border-white text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-white hover:text-black transition-colors"
            >
              BLIV MEDLEM
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </a>
          </HeroEnterWrapper>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-[#e0dbd3] bg-[#edeae3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "LEG", label: "Børnefodbold" },
            { value: "LÆR", label: "Udvikling" },
            { value: "TRIV", label: "Fællesskab" },
            { value: "SPIL", label: "Årgangsfodbold" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl md:text-4xl mb-1">{stat.value}</div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-[#6b6560]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Børnefodbold */}
      <section id="bornefodbold" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="aspect-[4/3] bg-[#edeae3] overflow-hidden relative">
            {settingsMap["ungdom_bornefodbold_image"] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settingsMap["ungdom_bornefodbold_image"]} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute bottom-4 left-4 bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1">
              Aldersgruppe U5-U12
            </div>
          </div>
          <div>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-6">BØRNEFODBOLD</h2>
            <p className="text-sm text-[#4a4540] leading-relaxed mb-6">
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
                <li key={point} className="flex items-center gap-3 text-sm text-[#2e2b27]">
                  <div className="w-1 h-1 bg-black rounded-full shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
            <a
              href="/kontakt"
              className="text-xs font-bold tracking-widest uppercase flex items-center gap-1 hover:underline"
            >
              KONTAKT OS OM BØRNEAFDELINGEN
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Elite Ungdom */}
      <section id="elite" className="py-16 md:py-24 px-4 md:px-8 bg-[#edeae3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-6">ELITE UNGDOM</h2>
            <p className="text-sm text-[#4a4540] leading-relaxed mb-6">
              For de spillere der vil have mere. Vores eliteprogram fokuserer på individuel teknisk
              udvikling, taktisk forståelse og fysisk træning. Vi skaber rammerne for, at de
              største talenter kan tage skridtet mod seniorfodbold på højt niveau.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { label: "Licenstræning", sub: "Struktureret elite-setup" },
                { label: "Udvikling", sub: "Individuelle forløb" },
              ].map((box) => (
                <div key={box.label} className="bg-[#f7f4ef] border border-[#e0dbd3] p-4">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-[#6b6560] mb-1">
                    {box.label}
                  </div>
                  <div className="text-xs text-[#4a4540]">{box.sub}</div>
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
          <div className="aspect-[4/3] bg-[#ddd8d0] overflow-hidden relative order-first md:order-last">
            {settingsMap["ungdom_elite_image"] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settingsMap["ungdom_elite_image"]} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
          </div>
        </div>
      </section>

      {/* Træningstider */}
      <section id="traening" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/2">
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-4">TRÆNINGSTIDER</h2>
            <p className="text-sm text-[#4a4540] leading-relaxed">
              Find din årgang herunder og se hvornår vi træner på banerne ved Vanløse Idrætspark.
              Bemærk at tiderne kan variere mellem sommer- og vintersæson.
            </p>
          </div>
          <div className="md:w-1/2 w-full">
            {youthTeams.length > 0 ? (
              <>
                <div className="divide-y divide-[#e0dbd3] mb-6">
                  {youthTeams.map((team) => (
                    <div key={team.id} className="py-5">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wide">{team.age_group}</span>
                        {team.training_schedule && (
                          <span className="text-xs text-[#6b6560] text-right">{team.training_schedule}</span>
                        )}
                      </div>
                      {team.coach && (
                        <p className="text-[10px] text-[#8a847c] uppercase tracking-wide">Træner: {team.coach}</p>
                      )}
                      {team.description && (
                        <p className="text-xs text-[#6b6560] mt-1 leading-relaxed">{team.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="divide-y divide-gray-200 mb-6">
                {[
                  { group: "Børnefodbold (U5-U12)", schedule: "Kontakt klubben for aktuelle træningstider" },
                  { group: "Elite Ungdom (U13-U19)", schedule: "Kontakt klubben for aktuelle træningstider" },
                  { group: "Målmandstræning", schedule: "Kontakt klubben for aktuelle træningstider" },
                ].map((row) => (
                  <div key={row.group} className="flex justify-between items-center py-4">
                    <span className="text-xs font-bold uppercase tracking-wide">{row.group}</span>
                    <span className="text-xs text-[#6b6560]">{row.schedule}</span>
                  </div>
                ))}
              </div>
            )}
            <a
              href="/kontakt"
              className="inline-block bg-black text-white text-xs font-bold tracking-widest uppercase px-6 py-3 hover:bg-gray-900 transition-colors"
            >
              KONTAKT OS FOR TRÆNINGSTIDER
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="tilmelding" className="py-20 md:py-32 px-4 md:px-8 bg-[#141412] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-5xl md:text-7xl leading-[0.9] mb-6">
            KLAR TIL AT SPILLE?
          </h2>
          <p className="text-sm text-[#8a847c] italic mb-10">
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
              KONTAKT OS OM PRØVETRÆNING
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
