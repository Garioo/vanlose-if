import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, requireXhrHeader } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError } from "@/lib/observability";

type Type = "contact" | "volunteer" | "membership";
type Status = "new" | "handled";

const VALID_TYPE = new Set<Type>(["contact", "volunteer", "membership"]);
const VALID_STATUS = new Set<Status>(["new", "handled"]);

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function PATCH(req: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const csrfCheck = requireXhrHeader(req);
    if (csrfCheck) return csrfCheck;

    const body = await req.json();

    const type = (typeof body?.type === "string" ? body.type.trim().toLowerCase() : "") as Type;
    const status = (typeof body?.status === "string" ? body.status.trim().toLowerCase() : "") as Status;
    const ids = normalizeIds(body?.ids);

    if (!VALID_TYPE.has(type)) {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: "No ids provided." }, { status: 400 });
    }

    const table =
      type === "contact"
        ? "contact_submissions"
        : type === "volunteer"
          ? "volunteer_submissions"
          : "membership_submissions";
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({ status })
      .in("id", ids)
      .select("id,status");

    if (error && type === "membership") {
      const fallback = await supabaseAdmin
        .from("contact_submissions")
        .update({ status })
        .in("id", ids)
        .select("id,status");

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        updated: (fallback.data ?? []).length,
        ids: (fallback.data ?? []).map((row) => row.id),
      });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      updated: (data ?? []).length,
      ids: (data ?? []).map((row) => row.id),
    });
  } catch (error) {
    captureApiError(error, { route: "/api/admin/inbox/bulk", method: "PATCH" });
    return NextResponse.json({ error: "Kunne ikke opdatere henvendelser." }, { status: 500 });
  }
}
