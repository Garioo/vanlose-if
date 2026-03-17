import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { key } = await params;
  const { value } = await req.json();
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
