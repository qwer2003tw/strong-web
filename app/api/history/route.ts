import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { type HistoryRange, type HistorySnapshotResponse } from "@/lib/history";
import { getCurrentUser } from "@/lib/services/authService";
import { getHistorySnapshot } from "@/lib/services/historyService";

const DEFAULT_RANGE: HistoryRange = "30d";

function parseRange(value: string | null): HistoryRange {
  if (value === "7d" || value === "30d") {
    return value;
  }
  return DEFAULT_RANGE;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const range = parseRange(url.searchParams.get("range"));

  try {
    const { entries, trend } = await getHistorySnapshot(user.id, range, { client: supabase });
    const payload: HistorySnapshotResponse = {
      data: entries,
      trend,
      range,
      lastSyncedAt: new Date().toISOString(),
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to load history snapshot", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
