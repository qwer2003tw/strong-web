import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type SupabaseSession = Session | null;

export const createBrowserSupabaseClient = () =>
  createClientComponentClient<Database>();
