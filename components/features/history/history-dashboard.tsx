"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type {
  HistoryEntry,
  HistoryRange,
  HistoryTrendPoint,
  VolumeSummary,
  HistorySnapshotResponse,
} from "@/lib/history";
import { readCache, writeCache, historySnapshotKey, HISTORY_SUMMARY_CACHE_KEY } from "@/lib/idb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { HistoryFilters } from "@/components/features/history/history-filters";
import { HistoryTrendChart } from "@/components/features/history/history-trend-chart";
import { HistoryList } from "@/components/features/history/history-list";
import { OneRepMaxSection } from "@/components/features/history/one-rep-max/one-rep-max-section";

interface HistoryDashboardProps {
  initialHistory: HistoryEntry[];
  initialTrend: HistoryTrendPoint[];
  initialSummary: VolumeSummary[];
  initialRange?: HistoryRange;
  lastSyncedAt?: string | null;
}

const DEFAULT_RANGE: HistoryRange = "30d";

export function HistoryDashboard({
  initialHistory,
  initialTrend,
  initialSummary,
  initialRange = DEFAULT_RANGE,
  lastSyncedAt,
}: HistoryDashboardProps) {
  const t = useTranslations("history");
  const [range, setRange] = useState<HistoryRange>(initialRange);
  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [historyRange, setHistoryRange] = useState<HistoryRange>(initialRange);
  const [trend, setTrend] = useState<HistoryTrendPoint[]>(initialTrend);
  const [summary, setSummary] = useState<VolumeSummary[]>(initialSummary);
  const [syncedAt, setSyncedAt] = useState<string | null>(lastSyncedAt ?? new Date().toISOString());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    readCache<HistorySnapshotResponse>(historySnapshotKey(range)).then((cached) => {
      if (cancelled || !cached?.value) return;
      setHistory(cached.value.data);
      setTrend(cached.value.trend);
      setSyncedAt(
        cached.value.lastSyncedAt ?? new Date(cached.updatedAt).toISOString()
      );
      setHistoryRange(cached.value.range);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    let cancelled = false;
    readCache<VolumeSummary[]>(HISTORY_SUMMARY_CACHE_KEY).then((cached) => {
      if (cancelled || !cached?.value?.length) return;
      setSummary(cached.value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (historyRange !== range) return;
    const snapshot: HistorySnapshotResponse = {
      data: history,
      trend,
      range: historyRange,
      lastSyncedAt: syncedAt,
    };
    writeCache(historySnapshotKey(historyRange), snapshot).catch(() => undefined);
  }, [history, trend, syncedAt, historyRange, range]);

  useEffect(() => {
    if (!summary.length) return;
    writeCache(HISTORY_SUMMARY_CACHE_KEY, summary).catch(() => undefined);
  }, [summary]);

  const totalVolume = useMemo(
    () => summary.find((item) => item.period === range)?.totalVolume ?? 0,
    [summary, range]
  );

  async function refreshHistory(rangeToFetch: HistoryRange) {
    const response = await fetch(`/api/history?range=${rangeToFetch}`, { cache: "no-store" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Unable to load history");
    }
    const body = (await response.json()) as HistorySnapshotResponse;
    setHistory(body.data);
    setTrend(body.trend);
    setSyncedAt(body.lastSyncedAt ?? new Date().toISOString());
    setHistoryRange(rangeToFetch);
  }

  async function refreshSummary() {
    const response = await fetch("/api/analytics/volume", { cache: "no-store" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Unable to load analytics");
    }
    const body = (await response.json()) as { data: VolumeSummary[] };
    setSummary(body.data ?? []);
  }

  function handleRangeChange(nextRange: HistoryRange) {
    if (nextRange === range) return;
    setRange(nextRange);
    setError(null);
    startTransition(async () => {
      try {
        await refreshHistory(nextRange);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error ? refreshError.message : String(refreshError)
        );
      }
    });
  }

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      try {
        await Promise.all([refreshHistory(range), refreshSummary()]);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error ? refreshError.message : String(refreshError)
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <HistoryFilters
        range={range}
        onRangeChange={handleRangeChange}
        onRefresh={handleRefresh}
        isLoading={pending}
        lastSyncedAt={syncedAt}
      />
      {error ? <Alert message={error} variant="error" /> : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("trend.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <HistoryTrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">
                {t("summary.activeRange")}
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                {totalVolume.toLocaleString()}
              </p>
            </div>
            <dl className="space-y-3">
              {summary.map((item) => (
                <div key={item.period} className="rounded-md border border-slate-200 p-3">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    {item.period === "7d" ? t("summary.7d") : t("summary.30d")}
                  </dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {item.totalVolume.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
      <OneRepMaxSection />
      <HistoryList entries={history} />
    </div>
  );
}
