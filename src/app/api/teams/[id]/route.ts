import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();

  const { data: existingTeam, error: existingTeamError } = await supabase
    .from("teams")
    .select("name")
    .eq("id", id)
    .single();
  if (existingTeamError) return NextResponse.json({ error: existingTeamError.message }, { status: 500 });

  const payload = {
    ...body,
    name: typeof body?.name === "string" ? body.name.trim() : body?.name,
    abbreviation:
      typeof body?.abbreviation === "string"
        ? body.abbreviation.trim().toUpperCase() || null
        : body?.abbreviation ?? null,
  };

  const { data, error } = await supabaseAdmin.from("teams").update(payload).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const oldName = existingTeam?.name;
  const newName = payload?.name;
  if (typeof newName === "string") {
    const { error: byIdError } = await supabaseAdmin
      .from("standings")
      .update({ team: newName })
      .eq("team_id", id);
    if (byIdError) return NextResponse.json({ error: byIdError.message }, { status: 500 });
  }

  if (oldName && typeof newName === "string" && oldName !== newName) {
    const { error: byNameError } = await supabaseAdmin
      .from("standings")
      .update({ team: newName })
      .eq("team", oldName);
    if (byNameError) return NextResponse.json({ error: byNameError.message }, { status: 500 });
  }

  const { error: teamIdSyncError } = await supabaseAdmin
    .from("standings")
    .update({ team_id: id })
    .eq("team", payload.name);
  if (teamIdSyncError) return NextResponse.json({ error: teamIdSyncError.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const { data: existingTeam, error: existingTeamError } = await supabase
    .from("teams")
    .select("name")
    .eq("id", id)
    .single();
  if (existingTeamError) return NextResponse.json({ error: existingTeamError.message }, { status: 500 });

  const { error } = await supabaseAdmin.from("teams").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: standingsByIdError } = await supabaseAdmin.from("standings").delete().eq("team_id", id);
  if (standingsByIdError) return NextResponse.json({ error: standingsByIdError.message }, { status: 500 });

  const teamName = existingTeam?.name;
  if (teamName) {
    const { error: standingsByNameError } = await supabaseAdmin.from("standings").delete().eq("team", teamName);
    if (standingsByNameError) return NextResponse.json({ error: standingsByNameError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
