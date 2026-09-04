"use client";

import { type ReactNode } from "react";
import MatchDayBanner from "@/components/MatchDayBanner";
import Navbar from "@/components/Navbar";
import type { Match } from "@/lib/supabase";

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
  return (
    <>
      {/* Top navigation — fixed hamburger bar on smaller screens, sticky bar on desktop */}
      <div className="fixed top-0 left-0 right-0 z-50 lg:hidden">
        {hasBanner && <MatchDayBanner match={todayOrLive} />}
        <Navbar nextMatch={nextMatch} todayOrLive={todayOrLive} />
      </div>

      <div className="hidden lg:block sticky top-0 z-50">
        <Navbar nextMatch={nextMatch} todayOrLive={todayOrLive} />
      </div>

      {/* Spacer to offset the fixed bar below the desktop breakpoint */}
      <div className={hasBanner ? "h-[6.5rem] lg:hidden" : "h-16 lg:hidden"} />

      <main id="main-content" className="md:min-h-screen">{children}</main>
    </>
  );
}
