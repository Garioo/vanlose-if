import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { captureApiError } from "@/lib/observability";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", id)
      .order("minute", { ascending: true, nullsFirst: true })
      .order("stoppage_minute", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (error) {
    captureApiError(error, { route: "/api/matches/[id]/events", method: "GET" });
    return NextResponse.json({ error: "Kunne ikke hente kamp-events." }, { status: 500 });
  }
}
