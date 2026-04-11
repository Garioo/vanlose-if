"use client";

import { useEffect, useState, type ReactNode } from "react";
import MatchDayBanner from "@/components/MatchDayBanner";
import Navbar from "@/components/Navbar";
import type { Match } from "@/lib/supabase";

const SIDEBAR_STORAGE_KEY = "vif-public-sidebar-hidden";

interface SiteShellProps {
  children: ReactNode;
  hasBanner: boolean;
  nextMatch: Match | null;
  todayOrLive: Match | null;
}

export default function SiteShell({
  children,
  hasBanner,
  nextMatch,
  todayOrLive,
}: SiteShellProps) {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [loadedPreference, setLoadedPreference] = useState(false);

  useEffect(() => {
    try {
      setSidebarHidden(localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
    } finally {
      setLoadedPreference(true);
    }
  }, []);

  useEffect(() => {
    if (!loadedPreference) return;

    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarHidden ? "true" : "false");
    } catch {
      // Preference persistence is best-effort; the sidebar still works without storage.
    }
  }, [loadedPreference, sidebarHidden]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        {hasBanner && <MatchDayBanner match={todayOrLive} />}
        <Navbar nextMatch={nextMatch} todayOrLive={todayOrLive} />
      </div>

      <div className="md:min-h-screen">
        <div
          id="public-site-sidebar"
          className={[
            "hidden md:block fixed top-0 bottom-0 left-0 z-50 w-[180px] overflow-hidden bg-white border-r border-[#d8d2c8]",
            "transition-transform duration-200 ease-out",
            sidebarHidden ? "-translate-x-full" : "translate-x-0",
          ].join(" ")}
        >
          <Navbar nextMatch={nextMatch} todayOrLive={todayOrLive} />
        </div>

        <button
          type="button"
          onClick={() => setSidebarHidden((hidden) => !hidden)}
          className={[
            "hidden md:flex fixed top-4 z-[60] h-10 items-center gap-2 rounded border border-[#111111] bg-white px-3",
            "text-[0.68rem] font-semibold uppercase tracking-normal text-[#111111] shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
            "transition-[left,background-color,color] duration-200 hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80",
            sidebarHidden ? "left-4" : "left-[188px]",
          ].join(" ")}
          aria-controls="public-site-sidebar"
          aria-expanded={!sidebarHidden}
          aria-label={sidebarHidden ? "Vis menu" : "Skjul menu"}
        >
          <span aria-hidden>{sidebarHidden ? "Menu" : "Skjul"}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            {sidebarHidden ? (
              <path d="m9 18 6-6-6-6" />
            ) : (
              <path d="m15 18-6-6 6-6" />
            )}
          </svg>
        </button>

        <div className={hasBanner ? "h-[6.5rem] md:hidden" : "h-16 md:hidden"} />

        <div
          className={[
            "md:min-h-screen transition-[margin-left] duration-200 ease-out",
            sidebarHidden ? "md:ml-0" : "md:ml-[180px]",
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </>
  );
}
