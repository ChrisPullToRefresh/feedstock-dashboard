import { createClerkClient } from "@clerk/backend";

import {
  UsageError,
  generatePassword,
  parseEmail,
  provisionUser,
} from "../src/lib/provision-user.ts";

/**
 * Creates one staff account. See the README for when to run it and why
 * invitations are not used.
 *
 *   npm run provision -- someone@example.com
 *
 * Node reads .env.local through --env-file, so the secret key never appears on
 * the command line.
 */
async function main(): Promise<void> {
  const email = parseEmail(process.argv.slice(2));

  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new UsageError(
      "CLERK_SECRET_KEY is not set — run `vercel env pull .env.local` first",
    );
  }

  const password = generatePassword();
  const clerk = createClerkClient({ secretKey });
  const id = await provisionUser(clerk.users, email, password);

  console.log(`created ${email}`);
  console.log(`user id  ${id}`);
  // stderr, so `npm run provision ... > accounts.txt` cannot capture it into a
  // file by accident.
  console.error(`\ntemporary password (shown once): ${password}`);
  console.error("Share it over a private channel and have them change it.");
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(error.message);
    process.exit(1);
  }

  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
