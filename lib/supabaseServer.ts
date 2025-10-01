import {
  createRouteHandlerClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { cookies } from "next/headers";
import { createMockSupabaseClient, isMockSupabaseEnabled } from "@/lib/testing/mockSupabase";

export const createServerSupabaseClient = async () => {
  if (isMockSupabaseEnabled()) {
    return createMockSupabaseClient();
  }
  const cookieStore = await cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

export const createSupabaseRouteHandlerClient = async () => {
  if (isMockSupabaseEnabled()) {
    return createMockSupabaseClient();
  }
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};
