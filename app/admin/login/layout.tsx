// app/admin/login/layout.tsx
// This layout intentionally overrides the parent app/admin/layout.tsx for the
// /admin/login route only. It renders NO AdminNav — just the bare page.
// Without this, Next.js wraps /admin/login inside AdminLayout, which renders
// the full sidebar before the auth check completes on the client, leaking
// admin UI to unauthenticated visitors.
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
