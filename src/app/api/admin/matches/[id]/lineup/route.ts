import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseLineupPayload } from "@/lib/matchday-payload";
import { captureApiError } from "@/lib/observability";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const body = await req.json();
    const parsed = parseLineupPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("match_lineups")
      .upsert(
        {
          match_id: id,
          ...parsed.payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,team_side" },
      )
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    captureApiError(error, { route: "/api/admin/matches/[id]/lineup", method: "PUT" });
    return NextResponse.json({ error: "Kunne ikke gemme lineup." }, { status: 500 });
  }
}
