"use client";

import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { createContext, useContext, useMemo } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

interface SupabaseProviderProps {
  initialSession: Session | null;
  children: React.ReactNode;
}

const SupabaseClientContext = createContext<SupabaseClient<Database> | null>(null);

export function useSupabaseClient() {
  const client = useContext(SupabaseClientContext);
  if (!client) {
    throw new Error("Supabase client is not available in this context");
  }
  return client;
}

export function SupabaseSessionProvider({
  initialSession,
  children,
}: SupabaseProviderProps) {
  const client = useMemo(() => createBrowserSupabaseClient(), []) as SupabaseClient<Database>;

  return (
    <SupabaseClientContext.Provider value={client}>
      <SessionContextProvider supabaseClient={client} initialSession={initialSession}>
        {children}
      </SessionContextProvider>
    </SupabaseClientContext.Provider>
  );
}
