"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type {
  ContactSubmission,
  MembershipSubmission,
  NewsletterSubscription,
  VolunteerSubmission,
} from "@/lib/supabase";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants";

type InboxTab = "contact" | "volunteer" | "newsletter" | "membership";
type StatusFilter = "all" | "new" | "handled";
type StatusType = "new" | "handled";
type StatusCapableType = "contact" | "volunteer" | "membership";
type SearchableSubmission =
  | ContactSubmission
  | VolunteerSubmission
  | NewsletterSubscription
  | MembershipSubmission;

type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type InboxState = {
  tab: InboxTab;
  contact: ContactSubmission[];
  volunteer: VolunteerSubmission[];
  newsletter: NewsletterSubscription[];
  membership: MembershipSubmission[];
  counts: Record<InboxTab, number>;
  loading: boolean;
  bulkLoading: boolean;
  error: string | null;
  search: string;
  statusFilter: StatusFilter;
  onlyNew: boolean;
  page: number;
  total: number;
  selectedIds: string[];
};

type InboxAction =
  | { type: "SET_TAB"; tab: InboxTab }
  | { type: "SET_ITEMS"; tab: InboxTab; items: SearchableSubmission[]; total: number }
  | { type: "SET_COUNTS"; counts: Record<InboxTab, number> }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_BULK_LOADING"; bulkLoading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_SEARCH"; search: string }
  | { type: "SET_STATUS_FILTER"; statusFilter: StatusFilter }
  | { type: "SET_ONLY_NEW"; onlyNew: boolean }
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_SELECTED"; selectedIds: string[] }
  | { type: "RESET_PAGE" };

const initialState: InboxState = {
  tab: "contact",
  contact: [],
  volunteer: [],
  newsletter: [],
  membership: [],
  counts: { contact: 0, volunteer: 0, newsletter: 0, membership: 0 },
  loading: false,
  bulkLoading: false,
  error: null,
  search: "",
  statusFilter: "all",
  onlyNew: false,
  page: 1,
  total: 0,
  selectedIds: [],
};

function inboxReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, tab: action.tab };
    case "SET_ITEMS": {
      const update: Partial<InboxState> = { total: action.total, selectedIds: [] };
      if (action.tab === "contact") update.contact = action.items as ContactSubmission[];
      else if (action.tab === "volunteer") update.volunteer = action.items as VolunteerSubmission[];
      else if (action.tab === "membership") update.membership = action.items as MembershipSubmission[];
      else update.newsletter = action.items as NewsletterSubscription[];
      return { ...state, ...update };
    }
    case "SET_COUNTS":
      return { ...state, counts: action.counts };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_BULK_LOADING":
      return { ...state, bulkLoading: action.bulkLoading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_SEARCH":
      return { ...state, search: action.search };
    case "SET_STATUS_FILTER":
      return { ...state, statusFilter: action.statusFilter };
    case "SET_ONLY_NEW":
      return { ...state, onlyNew: action.onlyNew };
    case "SET_PAGE":
      return { ...state, page: action.page };
    case "SET_SELECTED":
      return { ...state, selectedIds: action.selectedIds };
    case "RESET_PAGE":
      return { ...state, page: 1 };
    default:
      return state;
  }
}

const tabLabels: Record<InboxTab, string> = {
  contact: "Kontakt",
  volunteer: "Frivillig",
  newsletter: "Nyhedsbrev",
  membership: "Medlemskab",
};

const EMPTY_PAGED: PagedResponse<never> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE_DEFAULT,
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
  const [state, dispatch] = useReducer(inboxReducer, initialState);

  const {
    tab,
    contact,
    volunteer,
    newsletter,
    membership,
    counts,
    loading,
    bulkLoading,
    error,
    search,
    statusFilter,
    onlyNew,
    page,
    total,
    selectedIds,
  } = state;

  const pageSize = PAGE_SIZE_DEFAULT;
  const statusTab = tab === "contact" || tab === "volunteer" || tab === "membership" ? tab : null;

  const loadCounts = useCallback(async () => {
    const tabs: InboxTab[] = ["contact", "volunteer", "newsletter", "membership"];

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

    dispatch({
      type: "SET_COUNTS",
      counts: {
        contact: results.find(([type]) => type === "contact")?.[1] ?? 0,
        volunteer: results.find(([type]) => type === "volunteer")?.[1] ?? 0,
        newsletter: results.find(([type]) => type === "newsletter")?.[1] ?? 0,
        membership: results.find(([type]) => type === "membership")?.[1] ?? 0,
      },
    });
  }, []);

  const load = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", error: null });

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
      const payload = (await res.json().catch(() => EMPTY_PAGED)) as PagedResponse<SearchableSubmission>;

      if (!res.ok) {
        dispatch({ type: "SET_ERROR", error: getErrorMessage(payload, "Kunne ikke indlæse henvendelser.") });
        return;
      }

      dispatch({ type: "SET_ITEMS", tab, items: payload.items ?? [], total: payload.total ?? 0 });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [onlyNew, page, pageSize, search, statusFilter, statusTab, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    dispatch({ type: "RESET_PAGE" });
  }, [tab, search, statusFilter, onlyNew]);

  async function setStatus(id: string, type: StatusCapableType, status: StatusType) {
    const res = await fetch(`/api/admin/inbox/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ type, status }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      dispatch({ type: "SET_ERROR", error: getErrorMessage(payload, "Kunne ikke opdatere status.") });
      return;
    }

    await Promise.all([load(), loadCounts()]);
  }

  async function markSelectedHandled() {
    if (!statusTab || selectedIds.length === 0) return;

    dispatch({ type: "SET_BULK_LOADING", bulkLoading: true });
    dispatch({ type: "SET_ERROR", error: null });

    try {
      const res = await fetch("/api/admin/inbox/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ type: statusTab, ids: selectedIds, status: "handled" }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        dispatch({ type: "SET_ERROR", error: getErrorMessage(payload, "Kunne ikke opdatere valgte henvendelser.") });
        return;
      }

      await Promise.all([load(), loadCounts()]);
    } finally {
      dispatch({ type: "SET_BULK_LOADING", bulkLoading: false });
    }
  }

  const visibleRows = useMemo(() => {
    if (tab === "contact") return contact;
    if (tab === "volunteer") return volunteer;
    if (tab === "membership") return membership;
    return newsletter;
  }, [contact, membership, newsletter, tab, volunteer]);

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
        {(["contact", "volunteer", "newsletter", "membership"] as InboxTab[]).map((t) => (
          <button key={t} onClick={() => dispatch({ type: "SET_TAB", tab: t })} className={tabCls(tab === t)}>
            {tabLabels[t]} ({counts[t]})
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 p-4 mb-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Søg</label>
          <input
            value={search}
            onChange={(e) => dispatch({ type: "SET_SEARCH", search: e.target.value })}
            placeholder={
              tab === "contact"
                ? "Navn, e-mail, emne, besked..."
                : tab === "volunteer"
                  ? "Navn, e-mail, rolle..."
                  : tab === "membership"
                    ? "Navn, e-mail, telefon, medlemskab..."
                    : "E-mail..."
            }
            className={`w-full ${controlInputCls}`}
          />
        </div>

        {statusTab && (
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => dispatch({ type: "SET_STATUS_FILTER", statusFilter: e.target.value as StatusFilter })}
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
              onChange={(e) => dispatch({ type: "SET_ONLY_NEW", onlyNew: e.target.checked })}
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
                    dispatch({
                      type: "SET_SELECTED",
                      selectedIds: e.target.checked ? contact.map((row) => row.id) : [],
                    });
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
                        dispatch({
                          type: "SET_SELECTED",
                          selectedIds: e.target.checked
                            ? [...selectedIds, row.id]
                            : selectedIds.filter((id) => id !== row.id),
                        });
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
                    dispatch({
                      type: "SET_SELECTED",
                      selectedIds: e.target.checked ? volunteer.map((row) => row.id) : [],
                    });
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
                      dispatch({
                        type: "SET_SELECTED",
                        selectedIds: e.target.checked
                          ? [...selectedIds, row.id]
                          : selectedIds.filter((id) => id !== row.id),
                      });
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
        <>
          {newsletter.length > 0 && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const rows = newsletter.map((r) => `${r.email},${new Date(r.created_at).toLocaleString("da-DK")}`);
                  const csv = ["E-mail,Tilmeldt"].concat(rows).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "nyhedsbrev-abonnenter.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-[10px] font-bold tracking-widest uppercase border border-gray-300 px-4 py-2 hover:border-black transition-colors"
              >
                EKSPORTER CSV
              </button>
            </div>
          )}
          <div className="bg-white border border-gray-200 divide-y divide-gray-100">
            {newsletter.map((row) => (
              <div key={row.id} className="px-4 py-4 flex items-center justify-between gap-4">
                <p className="text-xs font-bold">{row.email}</p>
                <p className="text-[10px] text-gray-400">{new Date(row.created_at).toLocaleString("da-DK")}</p>
              </div>
            ))}
            {newsletter.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen nyhedsbrevstilmeldinger.</div>}
          </div>
        </>
      )}

      {!loading && tab === "membership" && (
        <div className="bg-white border border-gray-200 divide-y divide-gray-100">
          {membership.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
              <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <input
                  type="checkbox"
                  checked={allSelectableChecked}
                  onChange={(e) => {
                    dispatch({
                      type: "SET_SELECTED",
                      selectedIds: e.target.checked ? membership.map((row) => row.id) : [],
                    });
                  }}
                />
                Vælg alle på siden
              </label>
            </div>
          )}
          {membership.map((row) => {
            const checked = selectedIds.includes(row.id);
            return (
              <div key={row.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        dispatch({
                          type: "SET_SELECTED",
                          selectedIds: e.target.checked
                            ? [...selectedIds, row.id]
                            : selectedIds.filter((id) => id !== row.id),
                        });
                      }}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">{row.name}</p>
                      <p className="text-xs text-gray-500">{row.email}</p>
                      {row.phone && <p className="text-xs text-gray-500">{row.phone}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{row.membership_tier}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-gray-400 mb-2">{new Date(row.created_at).toLocaleString("da-DK")}</p>
                    <select
                      value={row.status}
                      onChange={(e) => void setStatus(row.id, "membership", e.target.value as StatusType)}
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
          {membership.length === 0 && <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen medlemsanmodninger.</div>}
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
            onClick={() => dispatch({ type: "SET_PAGE", page: Math.max(1, page - 1) })}
            className="border border-gray-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            Forrige
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => dispatch({ type: "SET_PAGE", page: Math.min(totalPages, page + 1) })}
            className="border border-gray-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
          >
            Næste
          </button>
        </div>
      </div>
    </div>
  );
}
