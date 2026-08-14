import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";

/**
 * Everything behind authentication renders inside the shell. The shell sat in
 * the root layout until Phase 1, which wrapped every route in it — including
 * `/sign-in`, where a tab bar whose every destination redirects back to sign-in
 * is a dead end. Layouts nest, so the only way a route renders without the
 * shell is for the shell to live one level down. `(app)` is a route group, so
 * no URL changes.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      {/* One Toaster for everything behind authentication, so a page only has
          to raise a toast rather than mount somewhere to show one. */}
      <Toaster />
    </AppShell>
  );
}
