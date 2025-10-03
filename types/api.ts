import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db";

/**
 * Supabase client type that is shared across the application layers.
 */
export type StrongWebSupabaseClient = SupabaseClient<Database>;

/**
 * Base options supported by API calls. These options make it possible to reuse
 * an existing Supabase client, provide abort signals and tag cache entries for
 * future reuse.
 */
export interface ApiRequestOptions {
  /**
   * Optional Supabase client instance. When omitted, the API layer will create
   * a server-side client that is valid for the current request scope.
   */
  client?: StrongWebSupabaseClient | null;
  /**
   * Abort signal that can be used to cancel an in-flight request.
   */
  signal?: AbortSignal;
  /**
   * Cache key that higher-level services can use to implement response
   * caching. The API layer stores the value but does not implement caching by
   * itself yet.
   */
  cacheKey?: string;
}

/**
 * Normalised error returned by the API layer. This keeps downstream services
 * independent from Supabase's internal error representation.
 */
export interface ApiError {
  message: string;
  status?: number;
  cause?: unknown;
}

/**
 * Canonical API response format. The `data` property is populated when the
 * request succeeds. Any failure is represented by the `error` property.
 */
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

/**
 * Helper to build a consistent error payload for API responses.
 */
export function createApiError(message: string, cause?: unknown, status?: number): ApiError {
  return { message, cause, status };
}

/**
 * Utility that unwraps an API response and either returns the payload or
 * throws a descriptive error. Services can use this to keep their code clean.
 */
export function unwrapApiResponse<T>(response: ApiResponse<T>, fallbackMessage: string): T {
  if (response.error) {
    const error = response.error;
    const errorMessage = error.message || fallbackMessage;
    const enriched = new Error(errorMessage);
    if (error.cause) {
      // Attach the original error for debugging purposes without losing the
      // service friendly error instance.
      (enriched as Error & { cause?: unknown }).cause = error.cause;
    }
    throw enriched;
  }
  if (response.data === null) {
    throw new Error(fallbackMessage);
  }
  return response.data;
}
