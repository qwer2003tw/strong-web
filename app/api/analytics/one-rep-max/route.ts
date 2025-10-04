import { NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  DEFAULT_ONE_REP_MAX_METHOD,
  ONE_REP_MAX_METHODS,
  type OneRepMaxMethod,
} from "@/lib/analytics/oneRepMax";
import { createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import { getCurrentUser } from "@/lib/services/authService";
import { getOneRepMaxData } from "@/lib/services/analyticsService";

const EXERCISE_LIMIT = 25;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ParsedQuery {
  exerciseIds: string[];
  dateFrom: string | null;
  dateTo: string | null;
  method: OneRepMaxMethod;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime());
}

function parseIfNoneMatch(header: string | null | undefined) {
  if (!header) return [] as string[];
  return header
    .split(",")
    .map((value) => value.trim())
    .map((value) => (value.startsWith("W/") ? value.slice(2) : value))
    .filter(Boolean);
}

function ensureUniqueWithinLimit(values: string[]) {
  return Array.from(new Set(values)).slice(0, EXERCISE_LIMIT);
}

function extractExerciseIds(params: URLSearchParams) {
  const direct = params.getAll("exercise_id");
  const bracket = params.getAll("exercise_id[]");
  return ensureUniqueWithinLimit([...direct, ...bracket]);
}

function parseQuery(params: URLSearchParams): ParsedQuery | { error: string } {
  const exerciseIds = extractExerciseIds(params);
  for (const id of exerciseIds) {
    if (!UUID_PATTERN.test(id)) {
      return { error: `Invalid exercise_id: ${id}` };
    }
  }

  const methodParam = params.get("method");
  let method: OneRepMaxMethod = DEFAULT_ONE_REP_MAX_METHOD;
  if (methodParam) {
    const lowered = methodParam.toLowerCase();
    if (!ONE_REP_MAX_METHODS.includes(lowered as OneRepMaxMethod)) {
      return { error: `Unsupported method: ${methodParam}` };
    }
    method = lowered as OneRepMaxMethod;
  }

  const dateFromRaw = params.get("date_from") ?? params.get("dateFrom");
  const dateToRaw = params.get("date_to") ?? params.get("dateTo");

  const dateFrom = dateFromRaw ? dateFromRaw.trim() : null;
  const dateTo = dateToRaw ? dateToRaw.trim() : null;

  if (dateFrom && !isValidDate(dateFrom)) {
    return { error: `Invalid date_from: ${dateFrom}` };
  }
  if (dateTo && !isValidDate(dateTo)) {
    return { error: `Invalid date_to: ${dateTo}` };
  }
  if (dateFrom && dateTo) {
    const fromDate = new Date(`${dateFrom}T00:00:00Z`).getTime();
    const toDate = new Date(`${dateTo}T23:59:59Z`).getTime();
    if (fromDate > toDate) {
      return { error: "date_from must be earlier than date_to" };
    }
  }

  return {
    exerciseIds,
    dateFrom,
    dateTo,
    method,
  };
}

function buildEtag(seriesFingerprint: string) {
  const hash = createHash("sha1").update(seriesFingerprint).digest("base64url");
  return `"${hash}"`;
}

export async function GET(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const user = await getCurrentUser({ client: supabase });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = parseQuery(url.searchParams);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const analytics = await getOneRepMaxData(parsed, { client: supabase });
    const fingerprint = JSON.stringify({
      method: analytics.method,
      filters: analytics.filters,
      series: analytics.series,
      max: analytics.max,
    });
    const etag = buildEtag(fingerprint);
    const cacheHeaders = {
      ETag: etag,
      "Cache-Control": "no-cache",
    } as Record<string, string>;
    const requestEtags = parseIfNoneMatch(request.headers.get("if-none-match"));

    if (requestEtags.includes(etag)) {
      return new Response(null, {
        status: 304,
        headers: cacheHeaders,
      });
    }

    return NextResponse.json(
      {
        data: analytics,
        lastSyncedAt: new Date().toISOString(),
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status =
      error instanceof Error && typeof (error as Error & { status?: number }).status === "number"
        ? (error as Error & { status?: number }).status
        : undefined;

    if (status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("Failed to load 1RM analytics", error);
    return NextResponse.json({ error: message }, { status: status ?? 500 });
  }
}
