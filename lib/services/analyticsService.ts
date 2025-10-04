import type { ApiRequestOptions } from "@/types/api";
import { unwrapApiResponse } from "@/types/api";
import {
  DEFAULT_ONE_REP_MAX_METHOD,
  buildOneRepMaxPayload,
  normaliseMethod,
  type OneRepMaxMethod,
  type OneRepMaxQuery,
  type OneRepMaxResponsePayload,
} from "@/lib/analytics/oneRepMax";
import { AnalyticsAPI } from "@/lib/api/analyticsApi";

export interface OneRepMaxServiceQuery extends OneRepMaxQuery {
  method?: OneRepMaxMethod;
}

export async function getOneRepMaxData(
  query: OneRepMaxServiceQuery,
  options?: ApiRequestOptions
): Promise<OneRepMaxResponsePayload> {
  const method = normaliseMethod(query.method ?? DEFAULT_ONE_REP_MAX_METHOD);
  const response = await AnalyticsAPI.getOneRepMax({ ...query, method }, options);
  const rows = unwrapApiResponse(response, "Failed to load 1RM analytics");
  return buildOneRepMaxPayload(rows, method, {
    exerciseIds: query.exerciseIds ?? [],
    dateFrom: query.dateFrom ?? null,
    dateTo: query.dateTo ?? null,
  });
}
