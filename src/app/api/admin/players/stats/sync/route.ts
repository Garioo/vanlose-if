import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { syncPlayerStats } from "@/lib/stats-sync";

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdminApi(req);
  if (unauthorized) return unauthorized;

  const { season } = await req.json();
  if (!season) return NextResponse.json({ error: "season is required" }, { status: 400 });

  try {
    const result = await syncPlayerStats(season);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
