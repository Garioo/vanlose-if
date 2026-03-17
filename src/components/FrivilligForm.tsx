"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function FrivilligForm() {
  const [form, setForm] = useState({ name: "", email: "", role: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="md:w-1/2 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError("");
        trackEvent("volunteer_submit_started");

        try {
          const res = await fetch("/api/volunteer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data.error ?? "Kunne ikke sende tilmelding.");
            trackEvent("volunteer_submit_failed", { status: res.status });
            return;
          }

          setForm({ name: "", email: "", role: "", website: "" });
          setSuccess(true);
          trackEvent("volunteer_submit_success");
        } catch {
          setError("Kunne ikke sende tilmelding.");
          trackEvent("volunteer_submit_failed", { status: 0 });
        } finally {
          setLoading(false);
        }
      }}
    >
      <input
        type="text"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />
      <div>
        <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">
          Navn
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
          placeholder="Dit fulde navn"
          required
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">
          E-mail
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
          placeholder="din@email.dk"
          required
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">
          Interesse
        </label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-[#f7f4ef] appearance-none"
          required
        >
          <option value="" disabled>Vælg en rolle</option>
          <option>Træner & Holdleder</option>
          <option>Event & Kiosk</option>
          <option>Bestyrelse & Administration</option>
          <option>Andet</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white text-xs font-bold tracking-widest uppercase py-4 hover:bg-gray-900 transition-colors"
      >
        {loading ? "SENDER..." : "SEND TILMELDING"}
      </button>
      {success && (
        <p className="text-xs text-green-700">Tak. Vi kontakter dig snart om næste skridt.</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </form>
  );
}
