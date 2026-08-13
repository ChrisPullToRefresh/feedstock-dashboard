import { randomBytes } from "node:crypto";

/**
 * Account creation for internal staff, through the Clerk Backend API.
 *
 * `specs/tech-stack.md` § Auth records why this exists rather than an
 * invitation: Clerk's invitation flow is broken for this account and a support
 * ticket is open. `specs/mission.md` § Non-goals rules out self-service sign-up,
 * so this script is the only way an account comes into being.
 *
 * The logic lives here rather than in `scripts/` so it can be tested with the
 * Clerk client mocked; `scripts/provision-user.ts` is the thin command line
 * around it.
 */

/** The slice of Clerk's client this uses — everything else is irrelevant here. */
export type UserCreator = {
  createUser(params: {
    emailAddress: string[];
    password: string;
    skipPasswordChecks: boolean;
  }): Promise<{ id: string }>;
};

export class UsageError extends Error {}

/**
 * Deliberately conservative: one `@`, a dot-bearing domain, no whitespace. A
 * typo here creates an account nobody can sign in to, and deleting a Clerk user
 * is a manual step.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmail(argv: readonly string[]): string {
  const [email, ...rest] = argv;

  if (!email) {
    throw new UsageError("usage: npm run provision -- <email>");
  }

  if (rest.length > 0) {
    throw new UsageError("one email address at a time");
  }

  if (!EMAIL.test(email)) {
    throw new UsageError(`not an email address: ${email}`);
  }

  return email;
}

/**
 * 32 bytes of randomness, base64url. The operator hands this to the person
 * once and they change it; nothing stores it.
 */
export function generatePassword(): string {
  return randomBytes(32).toString("base64url");
}

export async function provisionUser(
  users: UserCreator,
  email: string,
  password: string,
): Promise<string> {
  const user = await users.createUser({
    emailAddress: [email],
    password,
    // The password is machine-generated and immediately rotated by its owner,
    // so Clerk's breach and strength checks have nothing useful to say about it.
    skipPasswordChecks: true,
  });

  return user.id;
}
