import { supabase } from "@/lib/supabase";
import { MEMBERSHIP_SUBJECT_PREFIX } from "@/lib/membership-submissions";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

function resolveCount(r: PromiseSettledResult<{ count: number | null; error: unknown }>): number {
  if (r.status === "rejected") return 0;
  if (r.value?.error) return 0;
  return r.value?.count ?? 0;
}

export default async function DashboardPage() {
  const [
    articles,
    players,
    matches,
    standings,
    contact,
    volunteer,
    newsletter,
    membership,
    contactNew,
    volunteerNew,
  ] = await Promise.allSettled([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("players").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("standings").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .not("subject", "ilike", `${MEMBERSHIP_SUBJECT_PREFIX}%`),
    supabaseAdmin.from("volunteer_submissions").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("newsletter_subscriptions").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("membership_submissions").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "new")
      .not("subject", "ilike", `${MEMBERSHIP_SUBJECT_PREFIX}%`),
    supabaseAdmin
      .from("volunteer_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  // Membership count with fallback to contact_submissions if membership_submissions table is unavailable
  const membershipResult = membership.status === "fulfilled" ? membership.value : null;
  const membershipCount = membershipResult && !membershipResult.error ? (membershipResult.count ?? 0) : null;

  const fallbackMembership = membershipCount === null
    ? await supabaseAdmin
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .ilike("subject", `${MEMBERSHIP_SUBJECT_PREFIX}%`)
    : null;

  const newHenvendelser = resolveCount(contactNew) + resolveCount(volunteerNew);

  const stats = [
    { label: "Artikler", count: resolveCount(articles), href: "/admin/nyheder", sub: "Offentliggjorte nyheder" },
    { label: "Spillere", count: resolveCount(players), href: "/admin/spillere", sub: "I truppen" },
    { label: "Kampe", count: resolveCount(matches), href: "/admin/kampe", sub: "Registrerede kampe" },
    { label: "Hold i stilling", count: resolveCount(standings), href: "/admin/stilling", sub: "Rækkeinddelinger" },
    {
      label: "Henvendelser",
      count:
        resolveCount(contact) +
        resolveCount(volunteer) +
        resolveCount(newsletter) +
        (membershipCount ?? fallbackMembership?.count ?? 0),
      href: "/admin/henvendelser",
      sub: "Kontakt, frivillig, medlemskab, nyhedsbrev",
      badge: newHenvendelser,
    },
  ];

  const actions = [
    { href: "/admin/nyheder/ny", label: "Skriv ny artikel", desc: "Opret og publicér en nyhed" },
    { href: "/admin/spillere", label: "Administrér truppen", desc: "Tilføj eller opdatér spillere" },
    { href: "/admin/kampe", label: "Tilføj kampresultat", desc: "Registrér kampe og resultater" },
    { href: "/admin/live", label: "Kør livekamp", desc: "Styr live ur, events og lineup" },
    { href: "/admin/stilling", label: "Opdatér stilling", desc: "Redigér rækkeinddelingen" },
    { href: "/admin/henvendelser", label: "Tjek henvendelser", desc: "Håndter indkomne formularer" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#3a3733] mb-1">Vanløse IF</p>
        <h1 className="font-display text-5xl tracking-tight text-white">DASHBOARD</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group bg-[#141412] border border-[#2a2825] px-6 py-6 hover:border-[#3a3733] transition-colors"
          >
            <div className="font-display text-6xl lg:text-7xl leading-none mb-2 tabular-nums text-white">
              {s.count}
            </div>
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#a09890] mb-0.5 flex items-center">
              {s.label}
              {"badge" in s && s.badge != null && s.badge > 0 && (
                <span className="inline-block bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 ml-2 leading-none">
                  {s.badge} NY
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#5a5550]">{s.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-3">
        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-[#3a3733] mb-3">
          Hurtige handlinger
        </p>
        <div className="bg-[#141412] border border-[#2a2825] divide-y divide-[#1e1c1a]">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between px-6 py-4 hover:bg-[#1a1816] transition-colors group"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#f0ede8]">{action.label}</p>
                <p className="text-[10px] text-[#5a5550] mt-0.5">{action.desc}</p>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-[#3a3733] group-hover:text-red-600 transition-colors shrink-0"
              >
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
