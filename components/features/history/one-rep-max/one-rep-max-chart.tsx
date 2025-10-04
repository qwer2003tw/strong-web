"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslations } from "next-intl";
import type { OneRepMaxPoint } from "@/lib/analytics/oneRepMax";
import type { UnitSystem } from "@/types/db";

interface OneRepMaxChartProps {
  points: OneRepMaxPoint[];
}

interface ExerciseMeta {
  id: string;
  name: string;
  unit: UnitSystem | null;
  color: string;
}

const COLOR_PALETTE = [
  "#2563eb",
  "#f97316",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#7c3aed",
];

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function unitSuffix(unit: UnitSystem | null) {
  return unit === "imperial" ? "lb" : "kg";
}

export function OneRepMaxChart({ points }: OneRepMaxChartProps) {
  const t = useTranslations("history");

  const { data, exercises } = useMemo(() => {
    const exerciseMap = new Map<string, { name: string; unit: UnitSystem | null; max: number }>();
    const byDate = new Map<
      string,
      {
        timestamp: number;
        dateKey: string;
        [exerciseId: string]: number | null;
      }
    >();

    const sortedPoints = [...points].sort(
      (a, b) => new Date(a.performedOn).getTime() - new Date(b.performedOn).getTime()
    );

    for (const point of sortedPoints) {
      const dateKey = point.performedOn.slice(0, 10);
      const timestamp = new Date(point.performedOn).getTime();

      const current = byDate.get(dateKey) ?? { timestamp, dateKey };
      current[point.exerciseId] = point.estimatedOneRm;
      current.timestamp = Math.min(current.timestamp, timestamp);
      byDate.set(dateKey, current);

      const existing = exerciseMap.get(point.exerciseId);
      if (!existing || point.estimatedOneRm > existing.max) {
        exerciseMap.set(point.exerciseId, {
          name: point.exerciseName,
          unit: point.unit,
          max: point.estimatedOneRm,
        });
      }
    }

    const sortedExercises = Array.from(exerciseMap.entries())
      .sort((a, b) => (b[1].max || 0) - (a[1].max || 0))
      .slice(0, COLOR_PALETTE.length);

    const exerciseMeta: ExerciseMeta[] = sortedExercises.map(([exerciseId, meta], index) => ({
      id: exerciseId,
      name: meta.name,
      unit: meta.unit,
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));

    const dataset = Array.from(byDate.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((entry) => {
        const record: Record<string, unknown> = {
          dateKey: entry.dateKey,
          dateLabel: formatDateLabel(entry.dateKey),
        };
        for (const exercise of exerciseMeta) {
          record[exercise.id] = entry[exercise.id] ?? null;
        }
        return record;
      });

    return {
      data: dataset,
      exercises: exerciseMeta,
    };
  }, [points]);

  if (!exercises.length || !data.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed border-slate-200 text-center text-sm text-slate-500">
        <p className="font-medium">{t("oneRm.empty.title")}</p>
        <p className="mt-1 max-w-sm text-slate-400">{t("oneRm.empty.description")}</p>
      </div>
    );
  }

  const exerciseUnits = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.unit]));
  const exerciseLabels = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.name]));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="dateKey" tickFormatter={(value) => formatDateLabel(String(value))} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value}`} />
          <Tooltip
            formatter={(value: number | string, exerciseId: string) => {
              const numericValueRaw = typeof value === "string" ? Number(value) : value;
              const numericValue = Number.isFinite(numericValueRaw) ? Number(numericValueRaw) : 0;
              const unit = unitSuffix(exerciseUnits[exerciseId as string] ?? null);
              return [`${numericValue.toFixed(1)} ${unit}`, exerciseLabels[exerciseId as string] ?? exerciseId];
            }}
            labelFormatter={(label) => t("oneRm.tooltip.label", { date: formatDateLabel(String(label)) })}
          />
          <Legend />
          {exercises.map((exercise) => (
            <Line
              key={exercise.id}
              type="monotone"
              dataKey={exercise.id}
              name={exercise.name}
              stroke={exercise.color}
              strokeWidth={2}
              connectNulls
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
