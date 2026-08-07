import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { buildMatchWritePayload } from "@/lib/match-payload";
import { withDerivedLiveMinute } from "@/lib/live-clock";
import { sortMatchesByKickoff } from "@/lib/matchDate";
import { getCurrentSeason } from "@/lib/season";
import type { Match } from "@/lib/supabase";

// GET returns matches for a single season. Defaults to the current season so
// the public site and live control only ever see the active season; pass
// ?season=all to fetch every season (admin archive views).
export async function GET(req: NextRequest) {
  const seasonParam = new URL(req.url).searchParams.get("season");
  let query = supabase.from("matches").select("*");
  if (seasonParam !== "all") {
    const currentSeason = await getCurrentSeason();
    const season = seasonParam?.trim() || currentSeason;
    // Legacy rows with a null season are treated as belonging to the current season.
    query =
      season === currentSeason
        ? query.or(`season.eq.${season},season.is.null`)
        : query.eq("season", season);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const sorted = sortMatchesByKickoff((data ?? []) as Match[], "desc");
  return NextResponse.json(sorted.map((row) => withDerivedLiveMinute(row)));
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const payload = await buildMatchWritePayload(body);
  // New matches belong to the current season unless one is explicitly provided.
  const season =
    typeof (body as { season?: unknown })?.season === "string" && (body as { season: string }).season.trim()
      ? (body as { season: string }).season.trim()
      : await getCurrentSeason();
  const { data, error } = await supabaseAdmin
    .from("matches")
    .insert({ ...payload, season })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
