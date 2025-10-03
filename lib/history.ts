import type { UnitSystem } from "@/types/db";

export type HistoryRange = "7d" | "30d";

export interface HistoryEntry {
  id: string;
  workoutId: string | null;
  exerciseId: string | null;
  exerciseName: string;
  muscleGroup: string | null;
  performedAt: string;
  sets: number;
  reps: number | null;
  weight: number | null;
  totalVolume: number;
  unit: UnitSystem | null;
}

export interface HistoryTrendPoint {
  date: string;
  totalVolume: number;
}

export interface VolumeSummary {
  period: HistoryRange;
  totalVolume: number;
}

const RANGE_IN_DAYS: Record<HistoryRange, number> = {
  "7d": 7,
  "30d": 30,
};

interface HistoryOptions {
  referenceDate?: Date;
}

function getReferenceDate(options?: HistoryOptions) {
  return options?.referenceDate ? new Date(options.referenceDate) : new Date();
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const normalized = startOfDay(date);
  const year = normalized.getFullYear();
  const month = `${normalized.getMonth() + 1}`.padStart(2, "0");
  const day = `${normalized.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rangeStart(range: HistoryRange, options?: HistoryOptions) {
  const reference = startOfDay(getReferenceDate(options));
  const days = RANGE_IN_DAYS[range];
  const start = new Date(reference);
  start.setDate(reference.getDate() - (days - 1));
  return start;
}

export function calculateEntryVolume(sets: number | null, reps: number | null, weight: number | null) {
  const resolvedSets = Number(sets ?? 0);
  const resolvedReps = Number(reps ?? 0);
  const resolvedWeight = Number(weight ?? 0);
  if (!Number.isFinite(resolvedSets) || !Number.isFinite(resolvedReps) || !Number.isFinite(resolvedWeight)) {
    return 0;
  }
  if (!resolvedSets || !resolvedReps || !resolvedWeight) {
    return 0;
  }
  return resolvedSets * resolvedReps * resolvedWeight;
}

export function buildHistoryTrend(
  entries: HistoryEntry[],
  range: HistoryRange,
  options?: HistoryOptions
): HistoryTrendPoint[] {
  const reference = startOfDay(getReferenceDate(options));
  const start = rangeStart(range, options);
  const totals = new Map<string, number>();

  for (const entry of entries) {
    const performed = new Date(entry.performedAt);
    if (performed < start || performed > reference) {
      continue;
    }
    const key = formatDateKey(performed);
    const current = totals.get(key) ?? 0;
    totals.set(key, current + (entry.totalVolume ?? 0));
  }

  const days = RANGE_IN_DAYS[range];
  const trend: HistoryTrendPoint[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(reference);
    date.setDate(reference.getDate() - index);
    const key = formatDateKey(date);
    trend.push({
      date: key,
      totalVolume: totals.get(key) ?? 0,
    });
  }

  return trend;
}

export function buildVolumeSummary(entries: HistoryEntry[], options?: HistoryOptions): VolumeSummary[] {
  const reference = startOfDay(getReferenceDate(options));
  const start7 = rangeStart("7d", { referenceDate: reference });
  const start30 = rangeStart("30d", { referenceDate: reference });

  let total7 = 0;
  let total30 = 0;

  for (const entry of entries) {
    const performed = new Date(entry.performedAt);
    if (performed >= start30 && performed <= reference) {
      total30 += entry.totalVolume ?? 0;
      if (performed >= start7) {
        total7 += entry.totalVolume ?? 0;
      }
    }
  }

  return [
    { period: "7d", totalVolume: total7 },
    { period: "30d", totalVolume: total30 },
  ];
}

export interface HistorySnapshotResponse {
  data: HistoryEntry[];
  trend: HistoryTrendPoint[];
  range: HistoryRange;
  lastSyncedAt?: string | null;
}
