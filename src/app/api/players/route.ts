import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { pick } from "@/lib/pick";
import { sortPlayersByNumber } from "@/lib/playerSort";
import type { Player } from "@/lib/supabase";

/**
 * Defaults to the active squad so public consumers (site search, pickers) never
 * surface players who have left. Admin screens pass `?status=all` — the live and
 * match pages in particular need every player to resolve historical lineups and
 * events by name.
 */
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  let query = supabase.from("players").select("*");
  if (status !== "all") query = query.eq("status", status ?? "active");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(sortPlayersByNumber((data ?? []) as Player[], "asc"));
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("players")
    .insert(pick(body, ["number", "name", "position", "image_url", "status", "new_club", "left_at"]))
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
