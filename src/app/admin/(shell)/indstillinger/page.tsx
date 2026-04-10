"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteSetting } from "@/lib/supabase";
import MediaPicker from "@/components/admin/MediaPicker";

export default function AdminIndstillingerPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json().catch(() => []);
    if (Array.isArray(data)) {
      setSettings(data);
      const v: Record<string, string> = {};
      for (const s of data) v[s.key] = s.value;
      setValues(v);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(key: string) {
    const res = await fetch(`/api/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: values[key] }),
    });
    if (res.ok) {
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    } else {
      setSaveError((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaveError((prev) => ({ ...prev, [key]: false })), 2000);
    }
  }

  async function handleImageSelect(key: string, url: string) {
    setValues((prev) => ({ ...prev, [key]: url }));
    const res = await fetch(`/api/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: url }),
    });
    if (res.ok) {
      setSaved((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaved((prev) => ({ ...prev, [key]: false })), 2000);
    } else {
      setSaveError((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSaveError((prev) => ({ ...prev, [key]: false })), 2000);
    }
  }

  const inputCls = "flex-1 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-[10px] font-bold tracking-widest uppercase mb-1 text-gray-600";

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">Admin</p>
        <h1 className="font-display text-3xl">INDSTILLINGER</h1>
      </div>

      <div className="bg-white border border-gray-200 divide-y divide-gray-100">
        {settings.map((s) => {
          const isImage = s.key.includes("_image");
          return (
            <div key={s.key} className="px-6 py-5">
              <label className={labelCls}>{s.label ?? s.key}</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={values[s.key] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [s.key]: e.target.value }))}
                  className={inputCls}
                  placeholder={isImage ? "https://..." : ""}
                />
                {isImage && (
                  <>
                    <MediaPicker onSelect={(url) => handleImageSelect(s.key, url)} label="VÆLG" />
                    {values[s.key] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={values[s.key]}
                        alt=""
                        className="h-8 w-8 object-cover border border-gray-200 shrink-0"
                      />
                    )}
                  </>
                )}
                <button
                  onClick={() => handleSave(s.key)}
                  className="text-xs font-bold tracking-widest uppercase bg-black text-white px-5 py-2 hover:bg-gray-900 transition-colors shrink-0"
                >
                  {saved[s.key] ? "GEMT ✓" : saveError[s.key] ? <span className="text-red-400">FEJL</span> : "GEM"}
                </button>
              </div>
            </div>
          );
        })}
        {settings.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">Ingen indstillinger.</div>
        )}
      </div>
    </div>
  );
}
