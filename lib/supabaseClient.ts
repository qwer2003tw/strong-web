import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

declare global {
  interface Window {
    __supabaseMock?: SupabaseClient<Database>;
  }
}

export type SupabaseSession = Session | null;

export const createBrowserSupabaseClient = () => {
  if (typeof window !== "undefined" && window.__supabaseMock) {
    return window.__supabaseMock;
  }

  return createClientComponentClient<Database>();
};
