import Link from "next/link";
import SiteImage from "@/components/SiteImage";
import { supabase } from "@/lib/supabase";
import type { Match, PlayerStats, Staff, Standing } from "@/lib/supabase";
import { sortMatchesByKickoff, formatMatchDate } from "@/lib/matchDate";
import { getTeamOutcome, isVanlose } from "@/lib/match-result";
import { getCurrentSeason } from "@/lib/season";

type StatsRow = PlayerStats & { players: { id: string; name: string; number: string; position: string } | null };

/**
 * Results, standings, top scorers and staff.
 *
 * Split out of the page so the hero can stream while these four queries run —
 * the player_stats join is the slowest thing on the route.
 */
export default async function SeasonSections() {
  const currentSeason = await getCurrentSeason();

  const [{ data: matchData }, { data: standingsData }, { data: statsData }, { data: staffData }] = await Promise.all([
    supabase.from("matches").select("*").eq("is_upcoming", false).or(`season.eq.${currentSeason},season.is.null`),
    supabase.from("standings").select("*").or(`season.eq.${currentSeason},season.is.null`).order("pos", { ascending: true }),
    supabase.from("player_stats").select("*, players(id, name, number, position)").eq("season", currentSeason).order("goals", { ascending: false }),
    supabase.from("staff").select("*").order("display_order", { ascending: true }),
  ]);

  const results: Match[] = sortMatchesByKickoff(matchData ?? [], "desc").slice(0, 2);
  const allStandings: Standing[] = standingsData ?? [];
  const isPlayoff = allStandings.some((r) => r.gruppe !== "regular");
  const vifRow = allStandings.find((r) => r.highlight);
  const vifGruppe = isPlayoff && vifRow ? vifRow.gruppe : null;
  const standingsGroup = isPlayoff && vifGruppe
    ? allStandings.filter((r) => r.gruppe === vifGruppe)
    : allStandings;
  const standings: Standing[] = standingsGroup.slice(0, 5);
  const standingsLabel = isPlayoff && vifGruppe === "oprykning"
    ? "OPRYKNINGSSPIL — TOP 5"
    : isPlayoff && vifGruppe === "nedrykning"
    ? "NEDRYKNINGSSPIL — TOP 5"
    : "STILLING — TOP 5";
  const stats: StatsRow[] = (statsData ?? []) as StatsRow[];
  const topScorers = stats.filter((s) => s.goals > 0 || s.assists > 0).slice(0, 5);
  const staff: Staff[] = (staffData ?? []) as Staff[];

  return (
    <>
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
              // The row carries a forward arrow, so it has to be a link —
              // it was a plain div, which made the arrow a dead affordance.
              <Link
                key={r.id}
                href={`/kampe/${r.id}`}
                className="flex items-center justify-between bg-[#f7f4ef] border border-[#e0dbd3] p-4 gap-4 hover:border-black transition-colors"
              >
                <span className="text-[10px] font-bold text-[#8a847c] w-14 shrink-0">{formatMatchDate(r.date)}</span>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-xs font-bold uppercase truncate">{r.home}</span>
                    {/* The club badge was hardcoded onto the home side, so
                        away fixtures showed the opponent wearing it. */}
                    <div
                      className={`w-6 h-6 text-[9px] font-bold flex items-center justify-center shrink-0 ${
                        isVanlose(r.home) ? "bg-black text-white" : "bg-[#ddd8d0] text-black"
                      }`}
                    >
                      {isVanlose(r.home) ? "V" : r.home.charAt(0)}
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
                    <div
                      className={`w-6 h-6 text-[9px] font-bold flex items-center justify-center shrink-0 ${
                        isVanlose(r.away) ? "bg-black text-white" : "bg-[#ddd8d0] text-black"
                      }`}
                    >
                      {isVanlose(r.away) ? "V" : r.away.charAt(0)}
                    </div>
                    <span className="text-xs font-bold uppercase truncate">{r.away}</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8a847c] shrink-0">
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </Link>
            ))}
            {results.length === 0 && (
              <p className="text-xs text-[#8a847c] py-4">Ingen resultater endnu.</p>
            )}
          </div>
        </div>

        {/* Standings */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl tracking-wide">{standingsLabel}</h2>
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

    {/* Træner & Stab */}
    {staff.length > 0 && (
      <section id="stab" className="py-12 md:py-16 px-4 md:px-8 bg-[#edeae3] border-b border-[#e0dbd3]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-xl tracking-wide mb-8">TRÆNER & STAB</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {staff.map((member) => (
              <div key={member.id}>
                <div className="aspect-3/4 bg-[#ddd8d0] mb-3 overflow-hidden relative">
                  {member.image_url ? (
                    <SiteImage src={member.image_url} alt={member.name} width={400} sizes={"(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"} className="object-cover object-top" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display text-5xl text-[#c5bfb6]">{member.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#6b6560] mb-0.5">{member.role}</p>
                <h3 className="text-sm font-bold uppercase tracking-wide">{member.name}</h3>
                {member.bio && <p className="text-[10px] text-[#8a847c] mt-1 leading-relaxed">{member.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    )}
    </>
  );
}
