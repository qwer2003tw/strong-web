import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { HistoryDashboard } from "@/components/features/history/history-dashboard";
import {
  buildHistoryTrend,
  getHistoryEntries,
  getVolumeAnalytics,
  type HistoryRange,
} from "@/lib/history";

export const revalidate = 0;

const DEFAULT_RANGE: HistoryRange = "30d";

export default async function HistoryPage() {
  const supabase = await createServerSupabaseClient();
  let userId: string | null = null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error) {
      userId = user?.id ?? null;
    }
  } catch (error) {
    console.error("Failed to resolve Supabase user", error);
  }

  if (!userId) {
    return (
      <HistoryDashboard
        initialHistory={[]}
        initialTrend={[]}
        initialSummary={[]}
        initialRange={DEFAULT_RANGE}
        lastSyncedAt={new Date().toISOString()}
      />
    );
  }

  try {
    const [entries, summary] = await Promise.all([
      getHistoryEntries(supabase, userId, DEFAULT_RANGE),
      getVolumeAnalytics(supabase, userId),
    ]);
    const trend = buildHistoryTrend(entries, DEFAULT_RANGE);

    return (
      <HistoryDashboard
        initialHistory={entries}
        initialTrend={trend}
        initialSummary={summary}
        initialRange={DEFAULT_RANGE}
        lastSyncedAt={new Date().toISOString()}
      />
    );
  } catch (error) {
    console.error("Failed to load training history", error);
    return (
      <HistoryDashboard
        initialHistory={[]}
        initialTrend={[]}
        initialSummary={[]}
        initialRange={DEFAULT_RANGE}
        lastSyncedAt={new Date().toISOString()}
      />
    );
  }
}
