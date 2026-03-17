import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi, requireXhrHeader } from "@/lib/api-auth";
import { mapFallbackMembershipSubmission } from "@/lib/membership-submissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError } from "@/lib/observability";

type Status = "new" | "handled";
type Type = "contact" | "volunteer" | "membership";

const VALID_STATUS = new Set<Status>(["new", "handled"]);
const VALID_TYPE = new Set<Type>(["contact", "volunteer", "membership"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const csrfCheck = requireXhrHeader(req);
    if (csrfCheck) return csrfCheck;

    const { id } = await params;
    const body = await req.json();

    const type = (typeof body?.type === "string" ? body.type.trim().toLowerCase() : "") as Type;
    const status = (typeof body?.status === "string" ? body.status.trim().toLowerCase() : "") as Status;

    if (!VALID_TYPE.has(type)) {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    if (type === "contact") {
      const { data, error } = await supabaseAdmin
        .from("contact_submissions")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, ...data });
    }

    if (type === "membership") {
      const { data, error } = await supabaseAdmin
        .from("membership_submissions")
        .update({ status })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        const fallback = await supabaseAdmin
          .from("contact_submissions")
          .update({ status })
          .eq("id", id)
          .select("*")
          .single();

        if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
        return NextResponse.json({ ok: true, ...mapFallbackMembershipSubmission(fallback.data) });
      }
      return NextResponse.json({ ok: true, ...data });
    }

    const { data, error } = await supabaseAdmin
      .from("volunteer_submissions")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    captureApiError(error, { route: "/api/admin/inbox/[id]", method: "PATCH" });
    return NextResponse.json({ error: "Kunne ikke opdatere status." }, { status: 500 });
  }
}
