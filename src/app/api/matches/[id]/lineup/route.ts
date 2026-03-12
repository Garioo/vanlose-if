import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { captureApiError } from "@/lib/observability";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const side = req.nextUrl.searchParams.get("team_side")?.trim().toLowerCase() ?? "home";

    if (side !== "home" && side !== "away") {
      return NextResponse.json({ error: "Invalid team_side." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("match_lineups")
      .select("*")
      .eq("match_id", id)
      .eq("team_side", side)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json(null);
    return NextResponse.json(data);
  } catch (error) {
    captureApiError(error, { route: "/api/matches/[id]/lineup", method: "GET" });
    return NextResponse.json({ error: "Kunne ikke hente lineup." }, { status: 500 });
  }
}
