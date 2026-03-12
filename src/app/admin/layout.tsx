// Passthrough layout — auth is handled by middleware.
// The sidebar shell lives in admin/(shell)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
