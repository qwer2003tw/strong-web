import {
  createRouteHandlerClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/db";
import { cookies } from "next/headers";
import { createMockSupabaseClient } from "@/lib/mockSupabase";

const useMockSupabase =
  process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === "true" ||
  process.env.USE_MOCK_SUPABASE === "true";

type ServerSupabaseClient = Awaited<
  ReturnType<typeof createServerComponentClient<Database>>
>;

export const createServerSupabaseClient = async () => {
  if (useMockSupabase) {
    return createMockSupabaseClient() as unknown as ServerSupabaseClient;
  }
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

export const createSupabaseRouteHandlerClient = async () => {
  if (useMockSupabase) {
    return createMockSupabaseClient() as unknown as ServerSupabaseClient;
  }
  const cookieStore = cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};
