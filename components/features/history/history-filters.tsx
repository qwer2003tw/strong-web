"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { HistoryRange } from "@/lib/history";

interface HistoryFiltersProps {
  range: HistoryRange;
  onRangeChange: (range: HistoryRange) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  lastSyncedAt?: string | null;
}

export function HistoryFilters({
  range,
  onRangeChange,
  onRefresh,
  isLoading,
  lastSyncedAt,
}: HistoryFiltersProps) {
  const t = useTranslations("history");
  const formattedLastSynced = lastSyncedAt
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSyncedAt))
    : null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        {formattedLastSynced ? (
          <p className="text-sm text-slate-500">
            {t("lastSynced", { timestamp: formattedLastSynced })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="history-range" className="whitespace-nowrap">
            {t("rangeLabel")}
          </Label>
          <Select
            id="history-range"
            value={range}
            disabled={isLoading}
            onChange={(event) => onRangeChange(event.target.value as HistoryRange)}
            className="w-36"
          >
            <option value="7d">{t("range.7d")}</option>
            <option value="30d">{t("range.30d")}</option>
          </Select>
        </div>
        <Button type="button" variant="ghost" onClick={onRefresh} disabled={isLoading}>
          {t("refresh")}
        </Button>
      </div>
    </div>
  );
}
