import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { createMockSupabaseClient } from "@/lib/mockSupabase";

const useMockSupabase =
  typeof process !== "undefined" &&
  (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === "true" ||
    process.env.USE_MOCK_SUPABASE === "true");

export const createBrowserSupabaseClient = () => {
  if (useMockSupabase) {
    return createMockSupabaseClient() as any;
  }

  return createClientComponentClient<Database>();
};
