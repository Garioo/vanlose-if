import Link from "next/link";
import type { Match } from "@/lib/supabase";

interface Props {
  match: Match | null;
}

export default function MatchDayBanner({ match }: Props) {
  if (!match) return null;

  const isLive = match.status === "live";

  const label = isLive
    ? `LIVE · ${match.home} ${match.home_score ?? 0} – ${match.away_score ?? 0} ${match.away}`
    : `Kamp i dag${match.time ? ` – kl. ${match.time}` : ""} mod ${match.away === "Vanløse IF" ? match.home : match.away}`;

  return (
    <Link
      href={`/kampe/${match.id}`}
      className="flex items-center justify-center gap-2 h-10 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-red-700 transition-colors px-4"
    >
      {isLive && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {label}
    </Link>
  );
}
