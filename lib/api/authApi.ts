import { createServerSupabaseClient, createSupabaseRouteHandlerClient } from "@/lib/supabaseServer";
import type { ApiRequestOptions, ApiResponse } from "@/types/api";
import { createApiError } from "@/types/api";
import type { ProfileRow, ProfileUpdate } from "@/types/view";
import type { Session, User } from "@supabase/supabase-js";

async function resolveClient(options?: ApiRequestOptions) {
  if (options?.client) {
    return options.client;
  }
  return createServerSupabaseClient();
}

export const AuthAPI = {
  async getUser(options?: ApiRequestOptions): Promise<ApiResponse<User>> {
    try {
      const supabase = await resolveClient(options);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return { data: null, error: createApiError("Unable to resolve authenticated user", error) };
      }
      return { data: data.user, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while resolving user", error) };
    }
  },

  async getSession(options?: ApiRequestOptions): Promise<ApiResponse<Session>> {
    try {
      const supabase = await resolveClient(options);
      // First verify the user with getUser() for better security
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { data: null, error: createApiError("Unable to resolve authenticated session", userError) };
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        return { data: null, error: createApiError("Unable to resolve authenticated session", error) };
      }
      return { data: data.session, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while resolving session", error) };
    }
  },

  async getProfile(userId: string, options?: ApiRequestOptions): Promise<ApiResponse<ProfileRow>> {
    try {
      const supabase = await resolveClient(options);
      const query = supabase.from("profiles").select("*").eq("id", userId);
      if (options?.signal) {
        query.abortSignal(options.signal);
      }
      const { data, error } = await query.maybeSingle();
      if (error) {
        return { data: null, error: createApiError("Failed to load profile", error) };
      }
      return { data: (data ?? null) as ProfileRow | null, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while loading profile", error) };
    }
  },

  async upsertProfile(
    userId: string,
    payload: ProfileUpdate,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<ProfileRow>> {
    try {
      const supabase = await resolveClient(options);
      const upsertData = { ...payload, id: userId } as any;
      const query = supabase
        .from("profiles")
        .upsert(upsertData);
      if (options?.signal) {
        query.abortSignal(options.signal);
      }
      const { data, error } = await query.select("*").single();
      if (error || !data) {
        return { data: null, error: createApiError("Failed to update profile", error ?? new Error("No data")) };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: createApiError("Unexpected error while updating profile", error) };
    }
  },
};

export async function createRouteAuthClient() {
  return createSupabaseRouteHandlerClient();
}
