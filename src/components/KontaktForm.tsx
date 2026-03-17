"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function KontaktForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <h2 className="font-display text-2xl mb-8">SEND BESKED</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setSuccess(false);
          setError("");
          trackEvent("contact_submit_started");

          try {
            const res = await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error ?? "Kunne ikke sende besked.");
              trackEvent("contact_submit_failed", { status: res.status });
              return;
            }

            setForm({ name: "", email: "", subject: "", message: "", website: "" });
            setSuccess(true);
            trackEvent("contact_submit_success");
          } catch {
            setError("Kunne ikke sende besked.");
            trackEvent("contact_submit_failed", { status: 0 });
          } finally {
            setLoading(false);
          }
        }}
        className="space-y-4"
      >
        <input
          type="text"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">Navn</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              placeholder="Dit navn"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
              placeholder="din@email.dk"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">Emne</label>
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-[#f7f4ef] appearance-none"
            required
          >
            <option value="" disabled>Vælg et emne</option>
            <option>Medlemskab</option>
            <option>Sponsorater</option>
            <option>Ungdomsfodbold</option>
            <option>Baner og faciliteter</option>
            <option>Presse og medier</option>
            <option>Andet</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">Besked</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={6}
            className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
            placeholder="Skriv din besked her..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white text-xs font-bold tracking-widest uppercase py-4 hover:bg-gray-900 transition-colors"
        >
          {loading ? "SENDER..." : "SEND BESKED"}
        </button>
        {success && (
          <p className="text-xs text-green-700">Tak. Din besked er modtaget, og vi svarer hurtigst muligt.</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </form>
    </div>
  );
}
