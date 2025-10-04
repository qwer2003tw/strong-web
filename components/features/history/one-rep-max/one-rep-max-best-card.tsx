"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { OneRepMaxMethod, OneRepMaxPoint } from "@/lib/analytics/oneRepMax";
import type { UnitSystem } from "@/types/db";

interface OneRepMaxBestCardProps {
  point: OneRepMaxPoint | null;
  method: OneRepMaxMethod;
}

function unitSuffix(unit: UnitSystem | null) {
  return unit === "imperial" ? "lb" : "kg";
}

function formatDecimal(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 });
}

export function OneRepMaxBestCard({ point, method }: OneRepMaxBestCardProps) {
  const t = useTranslations("history");

  if (!point) {
    return (
      <div className="space-y-2 text-sm text-slate-500">
        <p>{t("oneRm.best.noData")}</p>
      </div>
    );
  }

  const unit = unitSuffix(point.unit);
  const formattedValue = useMemo(() => formatDecimal(point.estimatedOneRm), [point.estimatedOneRm]);
  const formattedWeight = useMemo(() => formatDecimal(point.weight), [point.weight]);
  const performedOn = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(point.performedOn)
      ),
    [point.performedOn]
  );

  return (
    <div className="space-y-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {t(`oneRm.method.${method}` as const)} · {point.exerciseName}
      </p>
      <div>
        <p className="text-4xl font-semibold text-slate-900">
          {formattedValue}
          <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {t("oneRm.best.performedOn", { date: performedOn })}
        </p>
      </div>
      <div className="rounded-md border border-slate-200 p-3 text-sm text-slate-600">
        {t("oneRm.best.setSummary", {
          weight: formattedWeight,
          reps: point.reps,
          unit,
        })}
      </div>
    </div>
  );
}
