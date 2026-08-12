import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { pick } from "@/lib/pick";

export async function GET() {
  const { data, error } = await supabase
    .from("youth_teams")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("youth_teams")
    .insert(pick(body, ["age_group", "coach", "training_schedule", "description", "display_order", "image_url", "contact_email"]))
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
