import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/services/authService";
import { getVolumeSummary } from "@/lib/services/historyService";

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getVolumeSummary(user.id, { client: supabase });
    return NextResponse.json({ data, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to load analytics summary", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
