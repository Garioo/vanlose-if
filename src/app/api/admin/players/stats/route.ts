import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { pick } from "@/lib/pick";

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("player_stats")
    .upsert(pick(body, ["player_id", "season", "goals", "assists", "appearances", "yellow_cards", "red_cards"]), { onConflict: "player_id,season" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
