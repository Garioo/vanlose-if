import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import type { Match, MatchEvent, MatchLineup } from "@/lib/supabase";
import { buildPageMetadata } from "@/lib/metadata";
import MatchCenterClient from "@/components/MatchCenterClient";
import { isVanlose } from "@/lib/match-result";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase.from("matches").select("*").eq("id", id).maybeSingle<Match>();
  if (!data) {
    return buildPageMetadata({
      title: "Match Center — Vanløse IF",
      description: "Live score, events og lineup for Vanløse IF kampe.",
      path: `/kampe/${id}`,
    });
  }

  return buildPageMetadata({
    title: `${data.home} vs ${data.away} — Match Center`,
    description: `Følg kampen ${data.home} mod ${data.away} med live events og Vanløse lineup.`,
    path: `/kampe/${id}`,
  });
}

export default async function MatchCenterPage({ params }: Props) {
  const { id } = await params;

  const [{ data: match }, { data: events }] = await Promise.all([
    supabase.from("matches").select("*").eq("id", id).maybeSingle<Match>(),
    supabase
      .from("match_events")
      .select("*")
      .eq("match_id", id)
      .order("minute", { ascending: true, nullsFirst: true })
      .order("stoppage_minute", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true }),
  ]);

  if (!match) notFound();
  const lineupSide: "home" | "away" = isVanlose(match.home) ? "home" : "away";

  const { data: lineupResolved } = await supabase
    .from("match_lineups")
    .select("*")
    .eq("match_id", id)
    .eq("team_side", lineupSide)
    .maybeSingle<MatchLineup>();

  return (
    <MatchCenterClient
      initialMatch={match}
      initialEvents={(events ?? []) as MatchEvent[]}
      initialLineup={lineupResolved ?? null}
    />
  );
}
