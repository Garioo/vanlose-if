"use client";

import { createContext, useContext, useState } from "react";

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
