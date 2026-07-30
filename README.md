This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database migrations

SQL migration files live in `migrations/`, applied in order against `DATABASE_URL`:

```bash
npm run db:migrate
```

This isn't run in CI (no `DATABASE_URL` secret is configured there — CI's unit tests mock
the `pg` driver instead), so apply new migrations by hand against each Neon branch/environment
you're using (local, preview, production) after pulling changes that add one.

## Manual setup steps

Some setup can't be scripted and has to be done by hand in each provider's dashboard.

### Clerk: expose `publicMetadata` on the session token

`src/proxy.ts` reads each user's role off `sessionClaims.metadata.role`, but Clerk
doesn't include `publicMetadata` in the session token by default. Configure it once per
Clerk application:

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and select this project's
   Clerk application (`clerk-fulvous-bucket`).
2. In the left sidebar, click **Sessions**.
3. Find the **"Customize session token"** section and its **Claims** editor.
4. Add this claim (merge it in if the editor already has other claims, don't replace them):
   ```json
   {
     "metadata": "{{user.public_metadata}}"
   }
   ```
5. Click **Save**.

No restart or redeploy needed. Notes:
- Custom claims refresh roughly every 60 seconds, so a role change can take up to a
  minute to show up in a live session.
- Keep total custom claims under ~1.2KB — session tokens are stored in a cookie, and
  browsers cap cookies at ~4KB.

Each test/dev user's role is set via `publicMetadata.role` (`"admin"` or `"operator"`),
either in the Clerk dashboard's Users page or via `clerk api /users/<id>/metadata -X
PATCH -d '{"public_metadata":{"role":"operator"}}'`.

## Commit message conventions

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): summary`, imperative mood, summary line ≤72 characters. Scope is optional
but encouraged.

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`, `build`, `perf`.

Examples:

```
feat(auth): add Clerk sign-in flow
fix(shell): correct nav landmark label
docs(readme): document commit conventions
```

Enforced in two places:
- **Locally**, via a Husky `commit-msg` hook that runs `commitlint` on every commit.
- **In CI**, which re-lints the PR's full commit range as a required check — this catches
  commits made with `--no-verify`, from a machine without the hook installed, or
  edited/added through GitHub's web UI.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
