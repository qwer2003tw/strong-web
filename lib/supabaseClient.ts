import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/db";
import { createMockSupabaseClient } from "@/lib/mockSupabase";

const useMockSupabase =
  typeof process !== "undefined" &&
  (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === "true" ||
    process.env.USE_MOCK_SUPABASE === "true");

export const createBrowserSupabaseClient = () => {
  if (useMockSupabase) {
    return createMockSupabaseClient() as any;
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
