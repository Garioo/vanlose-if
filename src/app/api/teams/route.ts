import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";

export async function GET() {
  const { data, error } = await supabase.from("teams").select("*").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const payload = {
    ...body,
    name: typeof body?.name === "string" ? body.name.trim() : body?.name,
    abbreviation:
      typeof body?.abbreviation === "string"
        ? body.abbreviation.trim().toUpperCase() || null
        : body?.abbreviation ?? null,
  };

  const { data, error } = await supabaseAdmin.from("teams").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const createdTeam = (data ?? null) as { id?: string; name?: string } | null;
  if (createdTeam?.name && createdTeam?.id) {
    const { data: existingStanding, error: existingStandingError } = await supabaseAdmin
      .from("standings")
      .select("id")
      .eq("team_id", createdTeam.id)
      .maybeSingle();
    if (existingStandingError) return NextResponse.json({ error: existingStandingError.message }, { status: 500 });

    if (!existingStanding) {
      const { data: lastRow, error: lastRowError } = await supabaseAdmin
        .from("standings")
        .select("pos")
        .order("pos", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastRowError) return NextResponse.json({ error: lastRowError.message }, { status: 500 });

      const lastPos = Number((lastRow as { pos?: unknown } | null)?.pos ?? 0);
      const nextPos = (Number.isFinite(lastPos) ? lastPos : 0) + 1;
      const { error: createStandingError } = await supabaseAdmin
        .from("standings")
        .insert({ team: createdTeam.name, team_id: createdTeam.id, pos: nextPos });
      if (createStandingError) return NextResponse.json({ error: createStandingError.message }, { status: 500 });
    }
  }

  return NextResponse.json(data, { status: 201 });
}
