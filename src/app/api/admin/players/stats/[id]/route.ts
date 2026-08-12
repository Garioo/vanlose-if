import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { pick } from "@/lib/pick";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("player_stats")
    .update(pick(body, ["player_id", "season", "goals", "assists", "appearances", "yellow_cards", "red_cards"]))
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { error } = await supabaseAdmin.from("player_stats").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
