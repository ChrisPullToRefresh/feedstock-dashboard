# Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Application framework | Next.js (React, TypeScript) | Full-stack React framework with strong responsive/mobile support, fitting VISION.md's requirement that the app be mobile-friendly for both field data entry and mobile-primary data analysis. |
| Database | Neon (Postgres, on Vercel) | Relational store for producers, sequestration sites, and weight transactions; supports the mass-balance/yield-style reporting implied by tying incoming and outgoing weights together. Pairs natively with Vercel hosting. |
| Hosting | Vercel | Native deploy target for Next.js; integrates directly with Neon for the database. |
| Auth | Clerk with role-based access control (RBAC) | Individual accounts with roles (e.g. scale operator vs. admin) give auditability of who recorded each transaction, and support the future need to manage producer/site creation separately from day-to-day entry. |
