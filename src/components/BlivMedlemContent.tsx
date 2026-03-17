"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { MembershipTier } from "@/lib/supabase";

export default function BlivMedlemContent({ tiers }: { tiers: MembershipTier[] }) {
  const defaultSelected = tiers.find((t) => t.featured)?.name ?? tiers[0]?.name ?? "";
  const [form, setForm] = useState({ name: "", email: "", phone: "", website: "" });
  const [selected, setSelected] = useState(defaultSelected);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  return (
    <section className="py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="font-display text-4xl md:text-5xl leading-[0.9] mb-3">VÆLG MEDLEMSKAB</h2>
          <p className="text-sm text-[#4a4540]">Alle priser er pr. sæson og gælder for 2026.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border p-8 flex flex-col ${
                tier.featured ? "border-black bg-black text-white" : "border-[#e0dbd3]"
              }`}
            >
              {tier.featured && (
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white text-black px-2 py-1 self-start mb-4">
                  Mest valgt
                </span>
              )}
              <h3 className="font-display text-3xl mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display text-5xl">{tier.price}</span>
                <span className={`text-xs ${tier.featured ? "text-gray-400" : "text-gray-500"}`}>{tier.unit}</span>
              </div>
              <p className={`text-xs mb-6 leading-relaxed ${tier.featured ? "text-gray-300" : "text-gray-500"}`}>
                {tier.description}
              </p>
              <ul className="space-y-2 mb-8 flex-1">
                {tier.perks.map((perk) => (
                  <li key={perk} className={`flex items-start gap-2 text-xs ${tier.featured ? "text-gray-200" : "text-gray-600"}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mt-0.5 shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSelected(tier.name)}
                className={`text-xs font-bold tracking-widest uppercase py-3 transition-colors ${
                  tier.featured
                    ? "bg-white text-black hover:bg-gray-100"
                    : selected === tier.name
                    ? "bg-black text-white"
                    : "border border-black hover:bg-black hover:text-white"
                }`}
              >
                {selected === tier.name ? "Valgt ✓" : "Vælg"}
              </button>
            </div>
          ))}
        </div>

        {/* Signup form */}
        <div id="tilmeld" className="max-w-2xl mx-auto border-t border-[#e0dbd3] pt-12">
          <h2 className="font-display text-3xl mb-6">TILMELD DIG</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setSuccess(false);
              setError("");
              trackEvent("membership_submit_started", { tier: selected });

              try {
                const res = await fetch("/api/membership", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    website: form.website,
                    membershipTier: selected,
                  }),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setError(data.error ?? "Kunne ikke sende medlemsanmodning.");
                  trackEvent("membership_submit_failed", { status: res.status });
                  return;
                }

                setForm({ name: "", email: "", phone: "", website: "" });
                setSuccess(true);
                trackEvent("membership_submit_success", { tier: selected });
              } catch {
                setError("Kunne ikke sende medlemsanmodning.");
                trackEvent("membership_submit_failed", { status: 0 });
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
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">Navn</label>
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
                <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">Telefon</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="+45 00 00 00 00"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="din@email.dk"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase mb-1">Medlemskab</label>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full border border-[#d4cfc7] px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors bg-[#f7f4ef] appearance-none"
                required
              >
                {tiers.map((t) => (
                  <option key={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-xs font-bold tracking-widest uppercase py-4 hover:bg-gray-900 transition-colors"
            >
              {loading ? "SENDER..." : "TILMELD MIG SOM MEDLEM"}
            </button>
            {success && (
              <p className="text-xs text-green-700 text-center">
                Tak. Din medlemsanmodning er modtaget, og vi vender tilbage hurtigst muligt.
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
            <p className="text-[10px] text-[#8a847c] text-center">
              Vi bruger dine oplysninger til at følge op på medlemsanmodningen.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
