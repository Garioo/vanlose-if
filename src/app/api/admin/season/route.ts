import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { startNewSeason } from "@/lib/season";

// POST — start a new season: set current_season, reset standings, seed player_stats
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { season } = await req.json().catch(() => ({ season: "" }));
  if (typeof season !== "string" || !season.trim()) {
    return NextResponse.json({ error: "season is required" }, { status: 400 });
  }

  try {
    const result = await startNewSeason(season);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kunne ikke starte ny sæson.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
