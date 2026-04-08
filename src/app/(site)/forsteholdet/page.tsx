import type { Metadata } from "next";
import TruppenFilter from "@/components/TruppenFilter";
import HeroEnterWrapper from "@/components/HeroEnterWrapper";
import { supabase } from "@/lib/supabase";
import type { Player, Match, Standing, PlayerStats } from "@/lib/supabase";
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

type StatsRow = PlayerStats & { players: { id: string; name: string; number: string; position: string } | null };

export default async function ForsteholdetPage() {
  const { data: settingsData } = await supabase.from("site_settings").select("key, value");
  const settingsMap: Record<string, string> = {};
  for (const row of settingsData ?? []) settingsMap[row.key] = row.value;
  const currentSeason = settingsMap["current_season"] ?? "2024/25";

  const [{ data: playerData }, { data: matchData }, { data: standingsData }, { data: statsData }] = await Promise.all([
    supabase.from("players").select("*"),
    supabase.from("matches").select("*").eq("is_upcoming", false),
    supabase.from("standings").select("*").order("pos", { ascending: true }).limit(5),
    supabase.from("player_stats").select("*, players(id, name, number, position)").eq("season", currentSeason).order("goals", { ascending: false }),
  ]);

  const players: Player[] = sortPlayersByNumber(playerData ?? [], "asc");
  const results: Match[] = sortMatchesByKickoff(matchData ?? [], "desc").slice(0, 2);
  const standings: Standing[] = standingsData ?? [];
  const stats: StatsRow[] = (statsData ?? []) as StatsRow[];
  const topScorers = stats.filter((s) => s.goals > 0 || s.assists > 0).slice(0, 5);

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen">
      <section id="profil" className="pt-14 min-h-[70vh] flex items-end relative overflow-hidden bg-black text-white">
        {settingsMap["forsteholdet_hero_image"] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settingsMap["forsteholdet_hero_image"]} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
        )}
        <div className="absolute inset-0 top-14 bg-linear-to-b from-gray-900/50 to-black" />
        <div
          className="absolute inset-x-0 bottom-0 font-display text-[20vw] leading-none text-white/5 select-none overflow-hidden whitespace-nowrap"
          aria-hidden
        >
          VIF
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-16">
          <HeroEnterWrapper>
            <p className="hero-badge text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
              Førsteholdet
            </p>
            <h1 className="hero-title font-display text-6xl md:text-8xl lg:text-9xl leading-[0.85] mb-8">
              KLAR TIL
              <br />
              <span className="text-gray-400">KAMPDAG</span>
            </h1>
            <div className="hero-body max-w-2xl text-sm text-gray-300 leading-relaxed">
              Her finder du den aktuelle trup, de seneste resultater og stillingen omkring Vanløse IFs
              førstehold. Kampdata opdateres løbende i takt med sæsonen.
            </div>
          </HeroEnterWrapper>
        </div>
      </section>

      {/* Results + Standings */}
      <section id="resultater" className="py-12 md:py-16 px-4 md:px-8 bg-[#edeae3] border-b border-[#e0dbd3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl tracking-wide">SENESTE RESULTATER</h2>
              <Link href="/kampe" className="text-[10px] font-bold tracking-widest uppercase text-[#8a847c] hover:text-black">
                SE ALLE KAMPE
              </Link>
            </div>
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-[#f7f4ef] border border-[#e0dbd3] p-4 gap-4">
                  <span className="text-[10px] font-bold text-[#8a847c] w-14 shrink-0">{r.date}</span>
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
                            : "bg-[#edeae3] text-black"
                        }`}
                      >
                        {r.home_score} — {r.away_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 bg-[#ddd8d0] text-black text-[9px] font-bold flex items-center justify-center shrink-0">
                        {r.away.charAt(0)}
                      </div>
                      <span className="text-xs font-bold uppercase truncate">{r.away}</span>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8a847c] shrink-0">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </div>
              ))}
              {results.length === 0 && (
                <p className="text-xs text-[#8a847c] py-4">Ingen resultater endnu.</p>
              )}
            </div>
          </div>

          {/* Standings */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl tracking-wide">STILLING — TOP 5</h2>
            </div>
            <div className="border border-[#e0dbd3] divide-y divide-[#e0dbd3]">
              {standings.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between px-4 py-3 ${row.highlight ? "bg-black text-white" : "bg-[#f7f4ef]"}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold w-4 text-[#8a847c]">{row.pos}</span>
                    <span className="text-xs font-bold uppercase tracking-wide">{row.team}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] tabular-nums text-[#8a847c]">
                      {row.goals_scored || 0}-{row.goals_conceded || 0}
                    </span>
                    <span className="text-xs font-bold w-8 text-right">{row.pts}p</span>
                  </div>
                </div>
              ))}
              {standings.length === 0 && (
                <p className="text-xs text-[#8a847c] px-4 py-4">Ingen stilling.</p>
              )}
            </div>
            <Link
              href="/kampe"
              className="block w-full mt-3 border border-[#e0dbd3] text-center text-xs font-bold tracking-widest uppercase py-3 hover:bg-[#edeae3] transition-colors"
            >
              SE FULD TABEL
            </Link>
          </div>
        </div>
      </section>

      {/* Player stats */}
      {topScorers.length > 0 && (
        <section id="statistik" className="py-12 md:py-16 px-4 md:px-8 border-b border-[#e0dbd3]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl tracking-wide">STATISTIK — {currentSeason}</h2>
            </div>
            <div className="border border-[#e0dbd3] divide-y divide-[#e0dbd3]">
              <div className="grid grid-cols-12 text-[9px] font-bold tracking-widest uppercase text-[#6b6560] px-4 py-3 bg-[#edeae3]">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Spiller</span>
                <span className="col-span-2 text-center">Mål</span>
                <span className="col-span-2 text-center">Assists</span>
                <span className="col-span-2 text-center">Kampe</span>
              </div>
              {topScorers.map((s, i) => (
                <div key={s.id} className="grid grid-cols-12 items-center px-4 py-3 bg-[#f7f4ef]">
                  <span className="col-span-1 text-xs text-[#8a847c]">{i + 1}</span>
                  <span className="col-span-5 text-xs font-bold uppercase tracking-wide">
                    {s.players?.name ?? "Ukendt"}
                  </span>
                  <span className="col-span-2 text-sm font-bold text-center">{s.goals}</span>
                  <span className="col-span-2 text-xs text-[#6b6560] text-center">{s.assists}</span>
                  <span className="col-span-2 text-[10px] text-[#8a847c] text-center">{s.appearances}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Truppen */}
      <section id="truppen" className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl md:text-6xl leading-[0.9] mb-8">TRUPPEN</h2>
          <TruppenFilter players={players} />
        </div>
      </section>

    </div>
  );
}
