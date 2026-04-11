import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import type { Player, PlayerStats } from "@/lib/supabase";
import { buildPageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase.from("players").select("name, position").eq("id", id).single();
  if (!data) return {};
  const p = data as Player;
  return buildPageMetadata({
    title: `${p.name} — Vanløse IF`,
    description: `${p.name} spiller ${p.position.toLowerCase()} for Vanløse IF.`,
    path: `/spillere/${id}`,
  });
}

const positionLabel: Record<string, string> = {
  MÅLMÆND: "Målmand",
  FORSVAR: "Forsvar",
  MIDTBANE: "Midtbane",
  ANGREB: "Angreb",
};

export default async function SpillereProfilePage({ params }: Props) {
  const { id } = await params;

  const [{ data: playerData }, { data: statsData }, { data: settingsData }] = await Promise.all([
    supabase.from("players").select("*").eq("id", id).single(),
    supabase.from("player_stats").select("*").eq("player_id", id).order("season", { ascending: false }),
    supabase.from("site_settings").select("key, value").eq("key", "current_season").single(),
  ]);

  if (!playerData) notFound();

  const player = playerData as Player;
  const allStats = (statsData ?? []) as PlayerStats[];
  const currentSeason = (settingsData as { key: string; value: string } | null)?.value ?? "2024/25";
  const currentStats = allStats.find((s) => s.season === currentSeason) ?? null;

  const statBoxes = [
    { label: "Kampe", value: currentStats?.appearances ?? 0 },
    { label: "Mål", value: currentStats?.goals ?? 0 },
    { label: "Assists", value: currentStats?.assists ?? 0 },
    { label: "Gule kort", value: currentStats?.yellow_cards ?? 0 },
    { label: "Røde kort", value: currentStats?.red_cards ?? 0 },
  ];

  return (
    <div className="bg-[#f7f4ef] text-[#0d0d0b] min-h-screen">
      {/* Hero */}
      <section className="bg-black text-white relative overflow-hidden min-h-[60vh] flex items-end pt-14">
        {/* Number watermark */}
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 font-display leading-none text-white/5 select-none pointer-events-none"
          style={{ fontSize: "clamp(8rem, 30vw, 22rem)" }}
          aria-hidden
        >
          {player.number}
        </span>

        {/* Player photo */}
        {player.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.image_url}
            alt={player.name}
            className="absolute right-0 bottom-0 h-full max-w-[55%] object-contain object-bottom pointer-events-none"
          />
        )}

        <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12">
          <Link
            href="/forsteholdet#truppen"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-[#8a847c] hover:text-white transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5m7-7-7 7 7 7" />
            </svg>
            Truppen
          </Link>
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#dc2626] mb-2">
            {positionLabel[player.position] ?? player.position}
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.9] tracking-tight mb-1">
            {player.name}
          </h1>
          <p className="text-[#5a5550] text-sm mt-2">{currentSeason}</p>
        </div>
      </section>

      {/* Current season stat boxes */}
      <section className="border-b border-[#e0dbd3] bg-[#edeae3]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-5 divide-x divide-[#d8d2c8]">
          {statBoxes.map(({ label, value }) => (
            <div key={label} className="text-center px-4">
              <p className="font-display text-4xl md:text-5xl">{value}</p>
              <p className="text-[9px] font-bold tracking-widest uppercase text-[#8a847c] mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* All seasons table */}
      {allStats.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <h2 className="font-display text-2xl mb-6">SÆSONSTATISTIK</h2>
          <div className="border border-[#e0dbd3]">
            <div className="grid grid-cols-6 text-[9px] font-bold tracking-widest uppercase text-[#6b6560] px-4 py-3 bg-[#edeae3] border-b border-[#e0dbd3]">
              <span className="col-span-2">Sæson</span>
              <span className="text-center">K</span>
              <span className="text-center">M</span>
              <span className="text-center">A</span>
              <span className="text-center">Kort</span>
            </div>
            {allStats.map((s) => (
              <div
                key={s.id}
                className={`grid grid-cols-6 items-center px-4 py-3 border-b border-[#e0dbd3] last:border-0 text-sm ${s.season === currentSeason ? "bg-black text-white" : "hover:bg-[#edeae3]/60"}`}
              >
                <span className="col-span-2 font-bold text-xs uppercase tracking-wide">{s.season}</span>
                <span className="text-center">{s.appearances}</span>
                <span className="text-center">{s.goals}</span>
                <span className="text-center">{s.assists}</span>
                <span className="text-center text-xs text-[#8a847c]">
                  {s.yellow_cards > 0 && <span className="text-yellow-500 font-bold">{s.yellow_cards}G</span>}
                  {s.yellow_cards > 0 && s.red_cards > 0 && " "}
                  {s.red_cards > 0 && <span className="text-red-500 font-bold">{s.red_cards}R</span>}
                  {s.yellow_cards === 0 && s.red_cards === 0 && "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
