import { HistoryAPI } from "@/lib/api/historyApi";
import type { ApiRequestOptions } from "@/types/api";
import { unwrapApiResponse } from "@/types/api";
import {
  buildHistoryTrend,
  type HistoryEntry,
  type HistoryRange,
  type HistoryTrendPoint,
  type VolumeSummary,
} from "@/lib/history";

/**
 * Fetches history entries for the user within the requested range.
 */
export async function getHistoryEntries(
  userId: string,
  range: HistoryRange,
  options?: ApiRequestOptions
): Promise<HistoryEntry[]> {
  const response = await HistoryAPI.listEntries(userId, range, options);
  return unwrapApiResponse(response, "Failed to load history entries");
}

/**
 * Loads the user's training volume summary.
 */
export async function getVolumeSummary(
  userId: string,
  options?: ApiRequestOptions
): Promise<VolumeSummary[]> {
  const response = await HistoryAPI.loadVolumeSummary(userId, options);
  return unwrapApiResponse(response, "Failed to load volume summary");
}

/**
 * Convenience helper that resolves history entries, calculates the trend and
 * fetches the aggregated volume summary in one go.
 */
export async function getHistorySnapshot(
  userId: string,
  range: HistoryRange,
  options?: ApiRequestOptions
): Promise<{
  entries: HistoryEntry[];
  trend: HistoryTrendPoint[];
  summary: VolumeSummary[];
}> {
  const [entries, summary] = await Promise.all([
    getHistoryEntries(userId, range, options),
    getVolumeSummary(userId, options),
  ]);

  return {
    entries,
    trend: buildHistoryTrend(entries, range),
    summary,
  };
}
