import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db";

export async function GET() {
  const ok = await healthCheck();
  return NextResponse.json({ ok }, { status: ok ? 200 : 503 });
}
