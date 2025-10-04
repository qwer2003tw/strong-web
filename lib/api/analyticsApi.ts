import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { ApiRequestOptions, ApiResponse } from "@/types/api";
import { createApiError } from "@/types/api";
import type { RawOneRepMaxRow } from "@/lib/analytics/oneRepMax";
import type { OneRepMaxMethod, OneRepMaxQuery } from "@/lib/analytics/oneRepMax";

async function resolveClient(options?: ApiRequestOptions) {
  if (options?.client) {
    return options.client;
  }
  return createServerSupabaseClient();
}

function buildRpcPayload(params: OneRepMaxQuery & { method: OneRepMaxMethod }) {
  return {
    exercise_ids: params.exerciseIds && params.exerciseIds.length ? params.exerciseIds : null,
    from_date: params.dateFrom ?? null,
    to_date: params.dateTo ?? null,
    method: params.method,
  };
}

export const AnalyticsAPI = {
  async getOneRepMax(
    params: OneRepMaxQuery & { method: OneRepMaxMethod },
    options?: ApiRequestOptions
  ): Promise<ApiResponse<RawOneRepMaxRow[]>> {
    try {
      const supabase = await resolveClient(options);
      const { data, error, status } = await supabase.rpc("get_one_rep_max", buildRpcPayload(params));

      if (error) {
        const code = typeof error.code === "string" ? error.code : undefined;
        const mappedStatus =
          code === "42501" || code === "PGRST301"
            ? 403
            : code === "22023"
              ? 400
              : status;
        return { data: null, error: createApiError("Failed to load 1RM data", error, mappedStatus) };
      }

      return { data: (data ?? []) as RawOneRepMaxRow[], error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while loading 1RM data", error) };
    }
  },
};
