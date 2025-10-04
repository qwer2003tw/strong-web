"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  type OneRepMaxMethod,
  type OneRepMaxRange,
  DEFAULT_ONE_REP_MAX_METHOD,
  ONE_REP_MAX_METHODS,
  ONE_REP_MAX_RANGE_DAYS,
  type OneRepMaxResponsePayload,
} from "@/lib/analytics/oneRepMax";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { OneRepMaxChart } from "@/components/features/history/one-rep-max/one-rep-max-chart";
import { OneRepMaxBestCard } from "@/components/features/history/one-rep-max/one-rep-max-best-card";
import { oneRepMaxCacheKey, readCache, writeCache } from "@/lib/idb";

const RANGE_OPTIONS: OneRepMaxRange[] = ["7d", "30d", "90d"];

function formatDateForQuery(date: Date) {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function getRangeBounds(range: OneRepMaxRange) {
  const days = ONE_REP_MAX_RANGE_DAYS[range];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(today.getDate() - (days - 1));

  return {
    dateFrom: formatDateForQuery(from),
    dateTo: formatDateForQuery(today),
  };
}

interface CacheEntry {
  payload: OneRepMaxResponsePayload;
  lastSyncedAt: string | null;
}

interface PersistedOneRepMaxEntry {
  data: OneRepMaxResponsePayload;
  lastSyncedAt: string | null;
  etag: string | null;
}

export function OneRepMaxSection({
  initialMethod = DEFAULT_ONE_REP_MAX_METHOD,
  initialRange = "30d",
}: {
  initialMethod?: OneRepMaxMethod;
  initialRange?: OneRepMaxRange;
}) {
  const t = useTranslations("history");
  const [range, setRange] = useState<OneRepMaxRange>(initialRange);
  const [method, setMethod] = useState<OneRepMaxMethod>(initialMethod);
  const [analytics, setAnalytics] = useState<OneRepMaxResponsePayload | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const etagCache = useRef(new Map<string, string>());
  const dataCache = useRef(new Map<string, CacheEntry>());
  const controllerRef = useRef<AbortController | null>(null);
  const activeKeyRef = useRef<string>(`${initialMethod}|${initialRange}`);

  const formattedLastSynced = useMemo(() => {
    if (!lastSyncedAt) return null;
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(lastSyncedAt));
  }, [lastSyncedAt]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const key = `${method}|${range}`;
    activeKeyRef.current = key;

    async function hydrate() {
      const cached = dataCache.current.get(key);
      if (cached && !cancelled) {
        setAnalytics(cached.payload);
        setLastSyncedAt(cached.lastSyncedAt);
        return;
      }

      const persisted = await readCache<PersistedOneRepMaxEntry>(oneRepMaxCacheKey(range, method));
      if (!persisted?.value || cancelled) {
        return;
      }

      const { data, lastSyncedAt: persistedSyncedAt, etag } = persisted.value;
      const timestamp = persistedSyncedAt ?? new Date(persisted.updatedAt).toISOString();
      dataCache.current.set(key, { payload: data, lastSyncedAt: timestamp });
      if (etag) {
        etagCache.current.set(key, etag);
      }

      if (!cancelled && activeKeyRef.current === key) {
        setAnalytics(data);
        setLastSyncedAt(timestamp);
      }
    }

    void (async () => {
      await hydrate();
      if (cancelled) return;
      setError(null);
      startTransition(() => {
        void fetchAnalytics(range, method, { force: false });
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, method]);

  async function fetchAnalytics(
    nextRange: OneRepMaxRange,
    nextMethod: OneRepMaxMethod,
    { force }: { force: boolean }
  ) {
    const key = `${nextMethod}|${nextRange}`;
    const { dateFrom, dateTo } = getRangeBounds(nextRange);
    const params = new URLSearchParams();
    params.set("method", nextMethod);
    params.set("date_from", dateFrom);
    params.set("date_to", dateTo);

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    try {
      const headers: Record<string, string> = { "Cache-Control": "no-cache" };
      if (!force) {
        const etag = etagCache.current.get(key);
        if (etag) {
          headers["If-None-Match"] = etag;
        }
      }

      const response = await fetch(`/api/analytics/one-rep-max?${params.toString()}`, {
        cache: "no-store",
        headers,
        signal: controller.signal,
      });

      if (response.status === 304) {
        const cached = dataCache.current.get(key);
        if (cached && activeKeyRef.current === key) {
          setAnalytics(cached.payload);
          setLastSyncedAt(new Date().toISOString());
        }
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to load analytics");
      }

      const etag = response.headers.get("etag");
      if (etag) {
        etagCache.current.set(key, etag);
      }

      const body = (await response.json()) as {
        data: OneRepMaxResponsePayload;
        lastSyncedAt?: string | null;
      };

      const timestamp = body.lastSyncedAt ?? new Date().toISOString();
      dataCache.current.set(key, { payload: body.data, lastSyncedAt: timestamp });
      await writeCache(oneRepMaxCacheKey(nextRange, nextMethod), {
        data: body.data,
        lastSyncedAt: timestamp,
        etag: etag ?? null,
      } as PersistedOneRepMaxEntry);

      if (activeKeyRef.current === key) {
        setAnalytics(body.data);
        setLastSyncedAt(timestamp);
      }
    } catch (fetchError) {
      if ((fetchError as Error).name === "AbortError") {
        return;
      }
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      if (activeKeyRef.current === key) {
        setError(message);
      }
    }
  }

  function handleRangeChange(nextRange: OneRepMaxRange) {
    if (nextRange === range) return;
    setRange(nextRange);
  }

  function handleMethodChange(nextMethod: OneRepMaxMethod) {
    if (nextMethod === method) return;
    setMethod(nextMethod);
  }

  function handleRefresh() {
    setError(null);
    startTransition(() => {
      void fetchAnalytics(range, method, { force: true });
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>{t("oneRm.title")}</CardTitle>
              {formattedLastSynced ? (
                <p className="text-xs text-slate-500">
                  {t("oneRm.lastSynced", { timestamp: formattedLastSynced })}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="one-rm-range" className="whitespace-nowrap text-xs uppercase text-slate-500">
                  {t("oneRm.rangeLabel")}
                </Label>
                <Select
                  id="one-rm-range"
                  value={range}
                  onChange={(event) => handleRangeChange(event.target.value as OneRepMaxRange)}
                  disabled={pending}
                  className="w-28"
                >
                  {RANGE_OPTIONS.map((option) => (
                    <option value={option} key={option}>
                      {t(`oneRm.range.${option}` as const)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="one-rm-method" className="whitespace-nowrap text-xs uppercase text-slate-500">
                  {t("oneRm.methodLabel")}
                </Label>
                <Select
                  id="one-rm-method"
                  value={method}
                  onChange={(event) => handleMethodChange(event.target.value as OneRepMaxMethod)}
                  disabled={pending}
                  className="w-36"
                >
                  {ONE_REP_MAX_METHODS.map((option) => (
                    <option value={option} key={option}>
                      {t(`oneRm.method.${option}` as const)}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="button" variant="ghost" onClick={handleRefresh} disabled={pending}>
                {t("refresh")}
              </Button>
            </div>
          </div>
          {error ? <Alert message={error} variant="error" /> : null}
        </CardHeader>
        <CardContent>
          <OneRepMaxChart points={analytics?.series ?? []} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("oneRm.best.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <OneRepMaxBestCard point={analytics?.max ?? null} method={method} />
        </CardContent>
      </Card>
    </div>
  );
}
