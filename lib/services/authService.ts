import type { User } from "@supabase/supabase-js";
import { AuthAPI } from "@/lib/api/authApi";
import type { ApiRequestOptions } from "@/types/api";
import { unwrapApiResponse } from "@/types/api";
import type { ProfileUpdate, ProfileView } from "@/types/view";

/**
 * Attempts to resolve the authenticated Supabase user for the current request.
 * The function returns `null` when the user is not signed in or when the
 * request encounters an authentication error.
 */
export async function getCurrentUser(options?: ApiRequestOptions): Promise<User | null> {
  const response = await AuthAPI.getUser(options);
  if (response.error) {
    console.debug("authService:getCurrentUser", response.error.message);
    return null;
  }
  return response.data;
}

/**
 * Returns the authenticated user and throws when the request is unauthorised.
 */
export async function requireUser(options?: ApiRequestOptions): Promise<User> {
  const user = await getCurrentUser(options);
  if (!user) {
    throw new Error("User is not authenticated");
  }
  return user;
}


/**
 * Loads the profile associated with the provided user identifier.
 */
export async function getUserProfile(
  userId: string,
  options?: ApiRequestOptions
): Promise<ProfileView | null> {
  const response = await AuthAPI.getProfile(userId, options);
  if (response.error) {
    console.debug("authService:getUserProfile", response.error.message);
    return null;
  }
  return response.data;
}

/**
 * Upserts the profile information for a given user and returns the updated
 * record.
 */
export async function upsertUserProfile(
  userId: string,
  payload: ProfileUpdate,
  options?: ApiRequestOptions
): Promise<ProfileView> {
  const response = await AuthAPI.upsertProfile(userId, payload, options);
  return unwrapApiResponse(response, "Failed to update profile");
}
