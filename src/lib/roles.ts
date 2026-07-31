import { headers } from "next/headers";

export type Role = "admin" | "operator";

export async function getUserRole(): Promise<Role | undefined> {
  const headerList = await headers();
  const role = headerList.get("x-user-role");
  return role === "admin" || role === "operator" ? role : undefined;
}
