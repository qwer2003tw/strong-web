"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { HistoryEntry } from "@/lib/history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HistoryListProps {
  entries: HistoryEntry[];
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HistoryList({ entries }: HistoryListProps) {
  const t = useTranslations("history");
  const grouped = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of entries) {
      const dateKey = new Date(entry.performedAt).toDateString();
      const existing = map.get(dateKey) ?? [];
      existing.push(entry);
      map.set(dateKey, existing);
    }
    return Array.from(map.entries()).map(([dateKey, items]) => ({
      date: new Date(dateKey),
      items: items.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()),
    }));
  }, [entries]);

  if (!entries.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("empty.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">{t("empty.description")}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <Card key={group.date.toISOString()}>
          <CardHeader>
            <CardTitle>
              {new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(group.date)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.map((entry) => (
              <div key={entry.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{entry.exerciseName}</p>
                    {entry.muscleGroup ? (
                      <p className="text-xs uppercase tracking-wide text-slate-500">{entry.muscleGroup}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.performedAt)}</p>
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600 sm:text-sm">
                  <div>
                    <dt className="font-medium text-slate-700">{t("entry.sets")}</dt>
                    <dd>{entry.sets}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-700">{t("entry.reps")}</dt>
                    <dd>{entry.reps ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-700">{t("entry.volume")}</dt>
                    <dd>{entry.totalVolume.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
