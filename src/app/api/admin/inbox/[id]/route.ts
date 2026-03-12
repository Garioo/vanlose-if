import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError } from "@/lib/observability";

type Status = "new" | "handled";
type Type = "contact" | "volunteer";

const VALID_STATUS = new Set<Status>(["new", "handled"]);
const VALID_TYPE = new Set<Type>(["contact", "volunteer"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

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
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from("volunteer_submissions")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    captureApiError(error, { route: "/api/admin/inbox/[id]", method: "PATCH" });
    return NextResponse.json({ error: "Kunne ikke opdatere status." }, { status: 500 });
  }
}
