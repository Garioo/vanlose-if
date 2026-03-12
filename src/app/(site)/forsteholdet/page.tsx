import type { Metadata } from "next";
import TruppenFilter from "@/components/TruppenFilter";
import { supabase } from "@/lib/supabase";
import type { Player, Match, Standing } from "@/lib/supabase";
import { sortMatchesByKickoff } from "@/lib/matchDate";
import { buildPageMetadata } from "@/lib/metadata";
import { getTeamOutcome, isVanlose } from "@/lib/match-result";
import { sortPlayersByNumber } from "@/lib/playerSort";
import Link from "next/link";

export const metadata: Metadata = buildPageMetadata({
  title: "Førsteholdet — Vanløse IF",
  description: "Mød Vanløse IFs førsteholdsgruppe, se resultater og stillingen i 3. Division.",
  path: "/forsteholdet",
});

const coaches = [
  { name: "Thomas Rasmussen", role: "Cheftræner" },
  { name: "Morten Olsen", role: "Assistenttræner" },
  { name: "Peter Schmeichel Jr.", role: "Målmandstræner" },
];

export default async function ForsteholdetPage() {
  const [{ data: playerData }, { data: matchData }, { data: standingsData }] = await Promise.all([
    supabase.from("players").select("*"),
    supabase.from("matches").select("*").eq("is_upcoming", false),
    supabase.from("standings").select("*").order("pos", { ascending: true }).limit(5),
  ]);

  const players: Player[] = sortPlayersByNumber(playerData ?? [], "asc");
  const results: Match[] = sortMatchesByKickoff(matchData ?? [], "desc").slice(0, 2);
  const standings: Standing[] = standingsData ?? [];

  return (
    <div className="bg-white text-black min-h-screen">
      {/* Captain Hero */}
      <section id="profil" className="pt-14 min-h-[70vh] flex items-end relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 top-14 bg-linear-to-b from-gray-900/50 to-black" />
        <div
          className="absolute inset-x-0 bottom-0 font-display text-[20vw] leading-none text-white/5 select-none overflow-hidden whitespace-nowrap"
          aria-hidden
        >
          KROGH
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-16">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
            Kaptajn / Profil
          </p>
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] mb-8">
            CHRISTIAN
            <br />
            <span className="text-gray-500">KROGH</span>
          </h1>
          <div className="flex flex-wrap gap-8">
            {[
              { label: "Position", value: "Forsvar" },
              { label: "Kampe", value: "245" },
              { label: "Mål", value: "12" },
              { label: "Alder", value: "29" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
                  {stat.label}
                </div>
                <div className="text-xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results + Standings */}
      <section id="resultater" className="py-12 md:py-16 px-4 md:px-8 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl tracking-wide">SENESTE RESULTATER</h2>
              <Link href="/kampe" className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-black">
                SE ALLE KAMPE
              </Link>
            </div>
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-white border border-gray-200 p-4 gap-4">
                  <span className="text-[10px] font-bold text-gray-400 w-14 shrink-0">{r.date}</span>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="text-xs font-bold uppercase truncate">{r.home}</span>
                      <div className="w-6 h-6 bg-black text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        V
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-sm font-bold px-2 py-1 ${
                          getTeamOutcome(r, isVanlose(r.home) ? "home" : "away") === "win"
                            ? "bg-black text-white"
                            : "bg-gray-100 text-black"
                        }`}
                      >
                        {r.home_score} — {r.away_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 bg-gray-200 text-black text-[9px] font-bold flex items-center justify-center shrink-0">
                        {r.away.charAt(0)}
                      </div>
                      <span className="text-xs font-bold uppercase truncate">{r.away}</span>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </div>
              ))}
              {results.length === 0 && (
                <p className="text-xs text-gray-400 py-4">Ingen resultater endnu.</p>
              )}
            </div>
          </div>

          {/* Standings */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl tracking-wide">STILLING — TOP 5</h2>
            </div>
            <div className="border border-gray-200 divide-y divide-gray-100">
              {standings.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between px-4 py-3 ${row.highlight ? "bg-black text-white" : "bg-white"}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold w-4 text-gray-400">{row.pos}</span>
                    <span className="text-xs font-bold uppercase tracking-wide">{row.team}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] tabular-nums text-gray-400">
                      {row.goals_scored || 0}-{row.goals_conceded || 0}
                    </span>
                    <span className="text-xs font-bold w-8 text-right">{row.pts}p</span>
                  </div>
                </div>
              ))}
              {standings.length === 0 && (
                <p className="text-xs text-gray-400 px-4 py-4">Ingen stilling.</p>
              )}
            </div>
            <Link
              href="/kampe"
              className="block w-full mt-3 border border-gray-200 text-center text-xs font-bold tracking-widest uppercase py-3 hover:bg-gray-50 transition-colors"
            >
              SE FULD TABEL
            </Link>
          </div>
        </div>
      </section>

      {/* Truppen */}
      <section id="truppen" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl md:text-6xl leading-[0.9] mb-8">TRUPPEN</h2>
          <TruppenFilter players={players} />
        </div>
      </section>

      {/* Trænerstaben */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-display text-4xl md:text-5xl leading-[0.9]">TRÆNERSTABEN</h2>
            <a href="/klubben" className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-black hidden md:flex items-center gap-1">
              LÆS OM STRATEGIEN
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <div key={coach.name} className="bg-white border border-gray-200 p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/player-placeholder.png" alt={coach.name} className="w-full h-full object-cover object-top opacity-60" />
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
                    {coach.role}
                  </p>
                  <h3 className="text-sm font-bold uppercase tracking-wide">{coach.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
