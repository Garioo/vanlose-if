import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const season = req.nextUrl.searchParams.get("season");

  let query = supabase
    .from("player_stats")
    .select("*, players(id, name, number, position)")
    .order("goals", { ascending: false });

  if (season) {
    query = query.eq("season", season);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
