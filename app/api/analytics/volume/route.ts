import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getVolumeAnalytics } from "@/lib/history";

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getVolumeAnalytics(supabase, user.id);
    return NextResponse.json({ data, lastSyncedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to load analytics summary", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
