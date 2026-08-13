/**
 * Clerk's components are the one exception to `specs/tech-stack.md`
 * § Application's shadcn-for-all-components rule, recorded in
 * `specs/2026-08-13-auth/plan.md` § Decisions: authentication is a protocol
 * rather than a widget. The exception is to the component library, not to the
 * look — so the theme's own tokens are handed to Clerk rather than restated as
 * literals.
 *
 * `var(--token)` keeps this honest across themes. The palette is chosen by
 * `prefers-color-scheme` at render time, so hard-coded values would pin the
 * sign-in surface to whichever theme was current when this file was written.
 *
 * Deliberately unannotated. Clerk's `Appearance` type is re-exported from
 * `@clerk/react/types` and `@clerk/shared/types`, neither of which this project
 * depends on directly, and `@clerk/nextjs/types` does not carry it. `<SignIn>`'s
 * own `appearance` prop is the type check, so a wrong shape fails at the call
 * site rather than needing an import from a transitive package.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorBackground: "var(--card)",
    colorInputBackground: "var(--background)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    colorSuccess: "var(--primary)",
    borderRadius: "var(--radius)",
    fontFamily: "var(--font-sans)",
  },
};
