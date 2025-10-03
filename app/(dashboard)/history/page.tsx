import { HistoryDashboard } from "@/components/features/history/history-dashboard";
import { type HistoryRange } from "@/lib/history";
import { getCurrentUser } from "@/lib/services/authService";
import { getHistorySnapshot } from "@/lib/services/historyService";

export const revalidate = 0;

const DEFAULT_RANGE: HistoryRange = "30d";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
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
    const { entries, trend, summary } = await getHistorySnapshot(user.id, DEFAULT_RANGE);
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
