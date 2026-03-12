"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContactSubmission, VolunteerSubmission, NewsletterSubscription } from "@/lib/supabase";

type InboxTab = "contact" | "volunteer" | "newsletter";
type StatusFilter = "all" | "new" | "handled";
type StatusType = "new" | "handled";
type StatusCapableType = "contact" | "volunteer";

type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

const tabLabels: Record<InboxTab, string> = {
  contact: "Kontakt",
  volunteer: "Frivillig",
  newsletter: "Nyhedsbrev",
};

const EMPTY_PAGED: PagedResponse<never> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 25,
};

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }
  return fallback;
}

export default function AdminHenvendelserPage() {
  const [tab, setTab] = useState<InboxTab>("contact");
  const [contact, setContact] = useState<ContactSubmission[]>([]);
  const [volunteer, setVolunteer] = useState<VolunteerSubmission[]>([]);
  const [newsletter, setNewsletter] = useState<NewsletterSubscription[]>([]);
  const [counts, setCounts] = useState<Record<InboxTab, number>>({
    contact: 0,
    volunteer: 0,
    newsletter: 0,
  });
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [onlyNew, setOnlyNew] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const statusTab = tab === "contact" || tab === "volunteer" ? tab : null;

  const loadCounts = useCallback(async () => {
    const tabs: InboxTab[] = ["contact", "volunteer", "newsletter"];

    const results = await Promise.all(
      tabs.map(async (type) => {
        const res = await fetch(`/api/admin/inbox?type=${type}&page=1&page_size=1`);
        const payload = (await res.json().catch(() => EMPTY_PAGED)) as PagedResponse<unknown>;
        if (!res.ok) {
          return [type, 0] as const;
        }
        return [type, payload.total ?? 0] as const;
      }),
    );

    setCounts({
      contact: results.find(([type]) => type === "contact")?.[1] ?? 0,
      volunteer: results.find(([type]) => type === "volunteer")?.[1] ?? 0,
      newsletter: results.find(([type]) => type === "newsletter")?.[1] ?? 0,
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        type: tab,
        page: String(page),
        page_size: String(pageSize),
      });

      const query = search.trim();
      if (query) params.set("q", query);
      if (onlyNew && statusTab) {
        params.set("only_new", "true");
      } else if (statusFilter !== "all" && statusTab) {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/admin/inbox?${params.toString()}`);
      const payload = (await res.json().catch(() => EMPTY_PAGED)) as PagedResponse<
        ContactSubmission | VolunteerSubmission | NewsletterSubscription
      >;

      if (!res.ok) {
        setError(getErrorMessage(payload, "Kunne ikke indlæse henvendelser."));
        return;
      }

      setTotal(payload.total ?? 0);
      setSelectedIds([]);

      if (tab === "contact") {
        setContact((payload.items as ContactSubmission[]) ?? []);
      } else if (tab === "volunteer") {
        setVolunteer((payload.items as VolunteerSubmission[]) ?? []);
      } else {
        setNewsletter((payload.items as NewsletterSubscription[]) ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [onlyNew, page, pageSize, search, statusFilter, statusTab, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, statusFilter, onlyNew]);

  async function setStatus(id: string, type: StatusCapableType, status: StatusType) {
    const res = await fetch(`/api/admin/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, status }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(getErrorMessage(payload, "Kunne ikke opdatere status."));
      return;
    }

    await Promise.all([load(), loadCounts()]);
  }

  async function markSelectedHandled() {
    if (!statusTab || selectedIds.length === 0) return;

    setBulkLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/inbox/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: statusTab, ids: selectedIds, status: "handled" }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(getErrorMessage(payload, "Kunne ikke opdatere valgte henvendelser."));
        return;
      }

      await Promise.all([load(), loadCounts()]);
    } finally {
      setBulkLoading(false);
    }
  }

  const visibleRows = useMemo(() => {
    if (tab === "contact") return contact;
    if (tab === "volunteer") return volunteer;
    return newsletter;
  }, [contact, newsletter, tab, volunteer]);

  const allSelectableChecked =
    statusTab !== null &&
    visibleRows.length > 0 &&
    visibleRows.every((row) => selectedIds.includes(row.id));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const tabCls = (active: boolean) =>
    `px-3 py-2 text-[10px] font-bold tracking-widest uppercase border ${
      active ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-300 hover:border-black"
    }`;

  const controlInputCls =
    "border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:border-black transition-colors";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">HENVENDELSER</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(["contact", "volunteer", "newsletter"] as InboxTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={tabCls(tab === t)}>
            {tabLabels[t]} ({counts[t]})
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 p-4 mb-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Søg</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Navn, e-mail, emne, besked..."
            className={`w-full ${controlInputCls}`}
          />
        </div>

        {statusTab && (
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className={`w-full ${controlInputCls} bg-white`}
              disabled={onlyNew}
            >
              <option value="all">Alle</option>
              <option value="new">Ny</option>
              <option value="handled">Håndteret</option>
            </select>
          </div>
        )}

        {statusTab && (
          <label className="md:col-span-2 inline-flex items-center gap-2 text-xs text-gray-600 pb-1">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={(e) => setOnlyNew(e.target.checked)}
              className="size-4 border-gray-300"
            />
            Kun nye
          </label>
        )}

        {statusTab && (
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => void markSelectedHandled()}
              disabled={bulkLoading || selectedIds.length === 0}
              className="w-full bg-black text-white text-[10px] font-bold tracking-widest uppercase px-3 py-2 disabled:opacity-50"
            >
              {bulkLoading ? "Arbejder..." : `Markér håndteret (${selectedIds.length})`}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-xs text-red-500">{error}</p>}
      {loading && <p className="mb-4 text-xs text-gray-400">Indlæser...</p>}

      {!loading && tab === "contact" && (
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          {contact.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
              <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <input
                  type="checkbox"
                  checked={allSelectableChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(contact.map((row) => row.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
                Vælg alle på siden
              </label>
            </div>
          )}
          {contact.map((row) => {
            const checked = selectedIds.includes(row.id);
            return (
              <div key={row.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedIds((prev) =>
                          e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                        );
                      }}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">{row.name}</p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{row.subject}</p>
                      <p className="text-xs mt-3 text-gray-700 whitespace-pre-wrap">{row.message}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-gray-400 mb-2">{new Date(row.created_at).toLocaleString("da-DK")}</p>
                    <select
                      value={row.status}
                      onChange={(e) => void setStatus(row.id, "contact", e.target.value as StatusType)}
                      className="border border-gray-300 px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                    >
                      <option value="new">Ny</option>
                      <option value="handled">Håndteret</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          {contact.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen kontaktbeskeder.</div>}
        </div>
      )}

      {!loading && tab === "volunteer" && (
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          {volunteer.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
              <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <input
                  type="checkbox"
                  checked={allSelectableChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(volunteer.map((row) => row.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
                Vælg alle på siden
              </label>
            </div>
          )}
          {volunteer.map((row) => {
            const checked = selectedIds.includes(row.id);
            return (
              <div key={row.id} className="px-4 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedIds((prev) =>
                        e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id),
                      );
                    }}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.email}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{row.role}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-gray-400 mb-2">{new Date(row.created_at).toLocaleString("da-DK")}</p>
                  <select
                    value={row.status}
                    onChange={(e) => void setStatus(row.id, "volunteer", e.target.value as StatusType)}
                    className="border border-gray-300 px-2 py-1 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <option value="new">Ny</option>
                    <option value="handled">Håndteret</option>
                  </select>
                </div>
              </div>
            );
          })}
          {volunteer.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen frivilligtilmeldinger.</div>}
        </div>
      )}

      {!loading && tab === "newsletter" && (
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          {newsletter.map((row) => (
            <div key={row.id} className="px-4 py-4 flex items-center justify-between gap-4">
              <p className="text-xs font-bold">{row.email}</p>
              <p className="text-[10px] text-gray-400">{new Date(row.created_at).toLocaleString("da-DK")}</p>
            </div>
          ))}
          {newsletter.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen nyhedsbrevstilmeldinger.</div>}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
          Side {page} af {totalPages} · {total} resultater
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="border border-gray-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            Forrige
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="border border-gray-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            Næste
          </button>
        </div>
      </div>
    </div>
  );
}
