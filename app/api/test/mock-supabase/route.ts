import { NextResponse } from "next/server";
import {
  createMockSupabaseClient,
  getMockSupabaseStore,
  resetMockSupabaseStore,
  type MockSupabaseStore,
  type WorkoutEntryInsert,
} from "@/lib/mockSupabase";

function mockEnabled() {
  return (
    process.env.USE_MOCK_SUPABASE === "true" ||
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === "true"
  );
}

export async function POST(request: Request) {
  if (!mockEnabled()) {
    return NextResponse.json({ error: "Mock Supabase is not enabled" }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as
      | { action?: "reset"; state?: Partial<MockSupabaseStore> }
      | { action: "insertEntry"; entry: WorkoutEntryInsert }
      | { action: "deleteEntry"; id: string; workout_id: string };

    if (!body || !("action" in body) || body.action === "reset") {
      resetMockSupabaseStore(body?.state);
      return NextResponse.json({ data: getMockSupabaseStore() });
    }

    const supabase = createMockSupabaseClient() as unknown as { from: (table: string) => any };

    if (body.action === "insertEntry") {
      const result = await supabase
        .from("workout_entries")
        .insert(body.entry as any)
        .select("*")
        .single();
      return NextResponse.json(result);
    }

    if (body.action === "deleteEntry") {
      const result = await supabase
        .from("workout_entries")
        .delete()
        .eq("id", body.id)
        .eq("workout_id", body.workout_id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function DELETE() {
  if (!mockEnabled()) {
    return NextResponse.json({ error: "Mock Supabase is not enabled" }, { status: 403 });
  }

  resetMockSupabaseStore();
  return NextResponse.json({ data: getMockSupabaseStore() });
}
