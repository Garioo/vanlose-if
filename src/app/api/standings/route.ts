import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { buildStandingWritePayload } from "@/lib/standing-payload";
import { getCurrentSeason } from "@/lib/season";

// GET returns standings for a single season (default current). Legacy null-season
// rows are shown under the current season; pass ?season=all for every season.
export async function GET(req: NextRequest) {
  const seasonParam = new URL(req.url).searchParams.get("season");
  let query = supabase.from("standings").select("*").order("pos");
  if (seasonParam !== "all") {
    const currentSeason = await getCurrentSeason();
    const season = seasonParam?.trim() || currentSeason;
    query =
      season === currentSeason
        ? query.or(`season.eq.${season},season.is.null`)
        : query.eq("season", season);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const payload = await buildStandingWritePayload(body);
  const season =
    typeof (body as { season?: unknown })?.season === "string" && (body as { season: string }).season.trim()
      ? (body as { season: string }).season.trim()
      : await getCurrentSeason();
  const { data, error } = await supabaseAdmin
    .from("standings")
    .insert({ ...payload, season })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
