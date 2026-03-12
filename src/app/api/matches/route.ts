import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { buildMatchWritePayload } from "@/lib/match-payload";
import { withDerivedLiveMinute } from "@/lib/live-clock";
import { sortMatchesByKickoff } from "@/lib/matchDate";
import type { Match } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("matches").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const sorted = sortMatchesByKickoff((data ?? []) as Match[], "desc");
  return NextResponse.json(sorted.map((row) => withDerivedLiveMinute(row)));
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const payload = await buildMatchWritePayload(body);
  const { data, error } = await supabaseAdmin.from("matches").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
