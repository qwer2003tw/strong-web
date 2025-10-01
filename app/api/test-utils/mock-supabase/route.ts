import { NextResponse } from "next/server";
import {
  isMockSupabaseEnabled,
  resetMockSupabaseState,
  setMockSupabaseState,
} from "@/lib/testing/mockSupabase";

export async function POST(request: Request) {
  if (!isMockSupabaseEnabled()) {
    return NextResponse.json({ error: "Mock Supabase is disabled" }, { status: 404 });
  }

  const payload = await request.json();
  setMockSupabaseState(payload);
  return NextResponse.json({ status: "ok" });
}

export async function DELETE() {
  if (!isMockSupabaseEnabled()) {
    return NextResponse.json({ error: "Mock Supabase is disabled" }, { status: 404 });
  }

  resetMockSupabaseState();
  return NextResponse.json({ status: "reset" });
}
