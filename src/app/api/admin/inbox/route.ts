import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import {
  mapFallbackMembershipSubmission,
  MEMBERSHIP_SUBJECT_PREFIX,
} from "@/lib/membership-submissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { captureApiError } from "@/lib/observability";

type InboxType = "contact" | "volunteer" | "newsletter" | "membership";
type Status = "new" | "handled";

const VALID_TYPES = new Set<InboxType>(["contact", "volunteer", "newsletter", "membership"]);
const VALID_STATUS = new Set<Status>(["new", "handled"]);

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function sanitizeSearch(value: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length > 100) return "";
  return trimmed.replace(/[,%_()\\']/g, " ");
}

function parseStatus(value: string | null): Status | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase() as Status;
  return VALID_STATUS.has(normalized) ? normalized : null;
}

export async function GET(req: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(req);
    if (unauthorized) return unauthorized;

    const rawType = req.nextUrl.searchParams.get("type");
    const type = (rawType?.trim().toLowerCase() ?? "") as InboxType | "";

    if (type && !VALID_TYPES.has(type as InboxType)) {
      return NextResponse.json({ error: "Invalid inbox type." }, { status: 400 });
    }

    const onlyNew = req.nextUrl.searchParams.get("only_new") === "true";
    const explicitStatus = parseStatus(req.nextUrl.searchParams.get("status"));
    if (req.nextUrl.searchParams.has("status") && !explicitStatus) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const status: Status | null = onlyNew ? "new" : explicitStatus;
    const query = sanitizeSearch(req.nextUrl.searchParams.get("q"));
    const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1, 500);
    const pageSize = parsePositiveInt(req.nextUrl.searchParams.get("page_size"), 50, 200);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (type === "contact") {
      let db = supabaseAdmin
        .from("contact_submissions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      db = db.not("subject", "ilike", `${MEMBERSHIP_SUBJECT_PREFIX}%`);

      if (status) {
        db = db.eq("status", status);
      }

      if (query) {
        db = db.or(
          `name.ilike.%${query}%,email.ilike.%${query}%,subject.ilike.%${query}%,message.ilike.%${query}%`,
        );
      }

      const { data, error, count } = await db;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize });
    }

    if (type === "volunteer") {
      let db = supabaseAdmin
        .from("volunteer_submissions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (status) {
        db = db.eq("status", status);
      }

      if (query) {
        db = db.or(`name.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%`);
      }

      const { data, error, count } = await db;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize });
    }

    if (type === "newsletter") {
      let db = supabaseAdmin
        .from("newsletter_subscriptions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (query) {
        db = db.ilike("email", `%${query}%`);
      }

      const { data, error, count } = await db;
      if (error) {
        let fallbackDb = supabaseAdmin
          .from("contact_submissions")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to)
          .ilike("subject", `${MEMBERSHIP_SUBJECT_PREFIX}%`);

        if (status) {
          fallbackDb = fallbackDb.eq("status", status);
        }

        if (query) {
          fallbackDb = fallbackDb.or(
            `name.ilike.%${query}%,email.ilike.%${query}%,subject.ilike.%${query}%,message.ilike.%${query}%`,
          );
        }

        const fallback = await fallbackDb;
        if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });

        return NextResponse.json({
          items: (fallback.data ?? []).map(mapFallbackMembershipSubmission),
          total: fallback.count ?? 0,
          page,
          pageSize,
        });
      }
      return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize });
    }

    if (type === "membership") {
      let db = supabaseAdmin
        .from("membership_submissions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (status) {
        db = db.eq("status", status);
      }

      if (query) {
        db = db.or(
          `name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,membership_tier.ilike.%${query}%`,
        );
      }

      const { data, error, count } = await db;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize });
    }

    const [contactRes, volunteerRes, newsletterRes, membershipRes] = await Promise.all([
      supabaseAdmin
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("volunteer_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("newsletter_subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("membership_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (contactRes.error) return NextResponse.json({ error: contactRes.error.message }, { status: 500 });
    if (volunteerRes.error) return NextResponse.json({ error: volunteerRes.error.message }, { status: 500 });
    if (newsletterRes.error) return NextResponse.json({ error: newsletterRes.error.message }, { status: 500 });
    if (membershipRes.error) {
      const fallbackMembershipRes = await supabaseAdmin
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .ilike("subject", `${MEMBERSHIP_SUBJECT_PREFIX}%`)
        .limit(50);

      if (fallbackMembershipRes.error) {
        return NextResponse.json({ error: fallbackMembershipRes.error.message }, { status: 500 });
      }

      return NextResponse.json({
        contact: contactRes.data ?? [],
        volunteer: volunteerRes.data ?? [],
        newsletter: newsletterRes.data ?? [],
        membership: (fallbackMembershipRes.data ?? []).map(mapFallbackMembershipSubmission),
      });
    }

    return NextResponse.json({
      contact: contactRes.data ?? [],
      volunteer: volunteerRes.data ?? [],
      newsletter: newsletterRes.data ?? [],
      membership: membershipRes.data ?? [],
    });
  } catch (error) {
    captureApiError(error, { route: "/api/admin/inbox", method: "GET" });
    return NextResponse.json({ error: "Kunne ikke indlæse henvendelser." }, { status: 500 });
  }
}
