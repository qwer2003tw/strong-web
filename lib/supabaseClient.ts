import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createMockSupabaseClient, isMockSupabaseEnabled } from "@/lib/testing/mockSupabase";

export type SupabaseSession = Session | null;

export const createBrowserSupabaseClient = () =>
  isMockSupabaseEnabled() ? (createMockSupabaseClient() as any) : createClientComponentClient<Database>();
