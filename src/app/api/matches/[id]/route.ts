import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { buildMatchWritePayload } from "@/lib/match-payload";
import { captureApiError } from "@/lib/observability";
import { withDerivedLiveMinute } from "@/lib/live-clock";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Kamp ikke fundet." }, { status: 404 });
    return NextResponse.json(withDerivedLiveMinute(data));
  } catch (error) {
    captureApiError(error, { route: "/api/matches/[id]", method: "GET" });
    return NextResponse.json({ error: "Kunne ikke hente kamp." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const body = await req.json();
    const payload = await buildMatchWritePayload(body);
    const { data, error } = await supabaseAdmin
      .from("matches")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    captureApiError(error, { route: "/api/matches/[id]", method: "PUT" });
    return NextResponse.json({ error: "Kunne ikke opdatere kamp." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const { error } = await supabaseAdmin.from("matches").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureApiError(error, { route: "/api/matches/[id]", method: "DELETE" });
    return NextResponse.json({ error: "Kunne ikke slette kamp." }, { status: 500 });
  }
}
