import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminApi } from "@/lib/api-auth";

// POST — split current regular standings into oprykning + nedrykning
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin
    .from("standings")
    .select("id, pos")
    .eq("gruppe", "regular")
    .order("pos", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Ingen hold i grundspil at splitte." }, { status: 400 });
  }

  const rows = data as { id: string; pos: number }[];
  const mid = Math.ceil(rows.length / 2);
  const oprykning = rows.slice(0, mid);
  const nedrykning = rows.slice(mid);

  const updates = [
    ...oprykning.map((r, i) => supabaseAdmin.from("standings").update({ gruppe: "oprykning", pos: i + 1 }).eq("id", r.id)),
    ...nedrykning.map((r, i) => supabaseAdmin.from("standings").update({ gruppe: "nedrykning", pos: i + 1 }).eq("id", r.id)),
  ];

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, oprykning: oprykning.length, nedrykning: nedrykning.length });
}

// DELETE — reset all standings back to grundspil, restore pos order
export async function DELETE(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseAdmin
    .from("standings")
    .select("id, gruppe, pos")
    .order("gruppe")
    .order("pos");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ ok: true });

  const rows = data as { id: string; gruppe: string; pos: number }[];

  // Merge oprykning (sorted by pos) then nedrykning (sorted by pos), re-number globally
  const oprykning = rows.filter((r) => r.gruppe === "oprykning");
  const nedrykning = rows.filter((r) => r.gruppe === "nedrykning");
  const regular = rows.filter((r) => r.gruppe === "regular");
  const ordered = [...oprykning, ...nedrykning, ...regular];

  const updates = ordered.map((r, i) =>
    supabaseAdmin.from("standings").update({ gruppe: "regular", pos: i + 1 }).eq("id", r.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
