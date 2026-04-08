"use client";

import { useEffect, useState } from "react";

export default function HeroEnterWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  return <div className={mounted ? "hero-enter" : ""}>{children}</div>;
}
