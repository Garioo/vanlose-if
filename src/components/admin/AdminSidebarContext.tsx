"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AdminSidebarContextType = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const AdminSidebarContext = createContext<AdminSidebarContextType>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  // The drawer only exists below `md` — past that the sidebar is permanent, so
  // drop the open state (and with it the scroll lock) when the viewport grows.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      if (mq.matches) setOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AdminSidebarContext.Provider
      value={{
        open,
        toggle: () => setOpen((v) => !v),
        close: () => setOpen(false),
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  );
}

export function useAdminSidebar() {
  return useContext(AdminSidebarContext);
}
