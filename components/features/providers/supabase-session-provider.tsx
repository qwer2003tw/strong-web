"use client";

import type { SupabaseClient, Session } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

interface SupabaseProviderProps {
  initialSession: Session | null;
  children: React.ReactNode;
}

const SupabaseClientContext = createContext<SupabaseClient<Database> | null>(null);
const SessionContext = createContext<Session | null>(null);

export function useSupabaseClient() {
  const client = useContext(SupabaseClientContext);
  if (!client) {
    throw new Error("Supabase client is not available in this context");
  }
  return client;
}

export function useSession() {
  return useContext(SessionContext);
}

export function SupabaseSessionProvider({
  initialSession,
  children,
}: SupabaseProviderProps) {
  const client = useMemo(() => createBrowserSupabaseClient(), []) as SupabaseClient<Database>;
  const [session, setSession] = useState<Session | null>(initialSession);

  useEffect(() => {
    // Get initial session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  return (
    <SupabaseClientContext.Provider value={client}>
      <SessionContext.Provider value={session}>
        {children}
      </SessionContext.Provider>
    </SupabaseClientContext.Provider>
  );
}
