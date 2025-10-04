import type { UnitSystem } from "@/types/db";

export type OneRepMaxMethod = "epley" | "brzycki";

export const ONE_REP_MAX_METHODS: OneRepMaxMethod[] = ["epley", "brzycki"];
export const DEFAULT_ONE_REP_MAX_METHOD: OneRepMaxMethod = "epley";

export type OneRepMaxRange = "7d" | "30d" | "90d";

export const ONE_REP_MAX_RANGE_DAYS: Record<OneRepMaxRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export interface OneRepMaxQuery {
  exerciseIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  method?: OneRepMaxMethod;
}

export interface OneRepMaxPoint {
  exerciseId: string;
  exerciseName: string;
  performedOn: string;
  estimatedOneRm: number;
  reps: number;
  weight: number;
  unit: UnitSystem | null;
  sourceEntryId: string | null;
}

export interface OneRepMaxResponsePayload {
  series: OneRepMaxPoint[];
  max: OneRepMaxPoint | null;
  method: OneRepMaxMethod;
  filters: {
    exerciseIds: string[];
    dateFrom: string | null;
    dateTo: string | null;
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normaliseMethod(input?: string | null): OneRepMaxMethod {
  const lower = typeof input === "string" ? input.toLowerCase() : DEFAULT_ONE_REP_MAX_METHOD;
  return ONE_REP_MAX_METHODS.includes(lower as OneRepMaxMethod)
    ? (lower as OneRepMaxMethod)
    : DEFAULT_ONE_REP_MAX_METHOD;
}

export function calculateOneRepMax(
  weight: number,
  reps: number,
  method: OneRepMaxMethod
): number {
  const safeWeight = isFiniteNumber(weight) && weight > 0 ? weight : 0;
  const safeReps = isFiniteNumber(reps) && reps > 0 ? Math.floor(reps) : 0;

  if (!safeWeight || !safeReps) {
    return 0;
  }

  if (method === "brzycki") {
    const boundedReps = Math.min(Math.max(safeReps, 1), 36);
    return safeWeight * (36 / (37 - boundedReps));
  }

  return safeWeight * (1 + safeReps / 30);
}

export function selectMaxPoint(points: OneRepMaxPoint[]): OneRepMaxPoint | null {
  if (!points.length) {
    return null;
  }
  return points.reduce<OneRepMaxPoint | null>((best, current) => {
    if (!best) return current;
    if (current.estimatedOneRm > best.estimatedOneRm) {
      return current;
    }
    if (current.estimatedOneRm === best.estimatedOneRm) {
      return new Date(current.performedOn) > new Date(best.performedOn) ? current : best;
    }
    return best;
  }, null);
}

export interface RawOneRepMaxRow {
  exercise_id: string;
  exercise_name: string | null;
  performed_on: string | null;
  estimated_1rm: number | string | null;
  reps: number | null;
  weight: number | string | null;
  unit: UnitSystem | null;
  source_entry_id: string | null;
}

export function mapOneRepMaxRows(rows: RawOneRepMaxRow[]): OneRepMaxPoint[] {
  return rows
    .map((row) => {
      if (!row.exercise_id || !row.performed_on) {
        return null;
      }
      const weight = parseNumeric(row.weight) ?? 0;
      const reps = parseNumeric(row.reps) ?? 0;
      const estimated = parseNumeric(row.estimated_1rm) ?? calculateOneRepMax(weight, reps, DEFAULT_ONE_REP_MAX_METHOD);
      return {
        exerciseId: row.exercise_id,
        exerciseName: row.exercise_name ?? "Unknown exercise",
        performedOn: new Date(row.performed_on).toISOString(),
        estimatedOneRm: estimated,
        reps,
        weight,
        unit: row.unit ?? null,
        sourceEntryId: row.source_entry_id ?? null,
      } satisfies OneRepMaxPoint;
    })
    .filter((value): value is OneRepMaxPoint => Boolean(value));
}

export function buildOneRepMaxPayload(
  rows: RawOneRepMaxRow[],
  method: OneRepMaxMethod,
  filters: { exerciseIds: string[]; dateFrom: string | null; dateTo: string | null }
): OneRepMaxResponsePayload {
  const series = mapOneRepMaxRows(rows);
  const max = selectMaxPoint(series);
  return {
    series,
    max,
    method,
    filters,
  };
}
