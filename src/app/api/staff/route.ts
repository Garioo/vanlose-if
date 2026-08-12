import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";
import { pick } from "@/lib/pick";

export async function GET() {
  const { data, error } = await supabase
    .from("staff")
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
    .from("staff")
    .insert(pick(body, ["name", "role", "image_url", "bio", "display_order"]))
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
