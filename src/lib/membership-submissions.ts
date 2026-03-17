import type { MembershipSubmission } from "@/lib/supabase";

type MembershipFallbackRow = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  status?: unknown;
  created_at?: unknown;
};

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

export const MEMBERSHIP_SUBJECT_PREFIX = "MEMBERSHIP::";
const FALLBACK_PHONE_PREFIX = "Telefon: ";
const FALLBACK_NO_PHONE = "Telefon ikke oplyst";

export function isMissingRelationError(error: SupabaseErrorLike | null | undefined, relation: string) {
  if (!error) return false;
  if (error.code === "42P01") return true;

  const haystack = JSON.stringify(error).toLowerCase();
  return haystack.includes(relation.toLowerCase()) && (
    haystack.includes("does not exist") ||
    haystack.includes("could not find the table") ||
    haystack.includes("schema cache")
  );
}

export function buildMembershipFallbackSubject(membershipTier: string) {
  return `${MEMBERSHIP_SUBJECT_PREFIX}${membershipTier}`;
}

export function buildMembershipFallbackMessage(phone: string) {
  return phone ? `${FALLBACK_PHONE_PREFIX}${phone}` : FALLBACK_NO_PHONE;
}

/**
 * MIGRATION NOTE — Fallback membership path
 *
 * Data storage:
 *   Primary:  `membership_submissions` table (id, name, email, phone, membership_tier, status, created_at)
 *   Fallback: `contact_submissions` table, rows where subject starts with MEMBERSHIP_SUBJECT_PREFIX
 *             - subject encodes the membership tier: `MEMBERSHIP::<tier>`
 *             - message encodes the phone: `Telefon: <phone>` or "Telefon ikke oplyst"
 *
 * Files that contain fallback paths (update/remove when migration is confirmed stable):
 *   - src/lib/membership-submissions.ts          (this file — mapFallbackMembershipSubmission)
 *   - src/app/api/membership/route.ts            (fallback insert into contact_submissions)
 *   - src/app/api/admin/inbox/route.ts           (fallback read from contact_submissions)
 *   - src/app/api/admin/inbox/[id]/route.ts      (fallback update in contact_submissions)
 *   - src/app/api/admin/inbox/bulk/route.ts      (fallback bulk update in contact_submissions)
 *   - src/app/admin/(shell)/dashboard/page.tsx   (fallback count from contact_submissions)
 *
 * When to delete this file:
 *   Once the `membership_submissions` table is confirmed stable in production and all
 *   historical fallback rows have been migrated or are no longer needed, remove all
 *   fallback paths and this file.
 */
export function mapFallbackMembershipSubmission(row: MembershipFallbackRow): MembershipSubmission {
  const message = typeof row.message === "string" ? row.message : "";
  const phone = message.startsWith(FALLBACK_PHONE_PREFIX)
    ? message.slice(FALLBACK_PHONE_PREFIX.length)
    : null;
  const subject = typeof row.subject === "string" ? row.subject : "";

  return {
    id: typeof row.id === "string" ? row.id : "",
    name: typeof row.name === "string" ? row.name : "",
    email: typeof row.email === "string" ? row.email : "",
    phone,
    membership_tier: subject.replace(MEMBERSHIP_SUBJECT_PREFIX, "").trim(),
    status: row.status === "handled" ? "handled" : "new",
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}
