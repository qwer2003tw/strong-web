"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabaseClient";

interface SupabaseProviderProps {
  initialUser: User | null;
  children: React.ReactNode;
}

const SupabaseClientContext = createContext<SupabaseClient<Database> | null>(null);
const UserContext = createContext<User | null>(null);

export function useSupabaseClient() {
  const client = useContext(SupabaseClientContext);
  if (!client) {
    throw new Error("Supabase client is not available in this context");
  }
  return client;
}

export function useUser() {
  return useContext(UserContext);
}

export function SupabaseSessionProvider({
  initialUser,
  children,
}: SupabaseProviderProps) {
  const client = useMemo(() => createBrowserSupabaseClient(), []) as SupabaseClient<Database>;
  const [user, setUser] = useState<User | null>(initialUser);

  useEffect(() => {
    // Verify initial user with getUser() for security
    client.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes and always re-verify with getUser()
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event) => {
      // Don't use the session from the callback - always verify with getUser()
      const { data: { user } } = await client.auth.getUser();
      setUser(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  return (
    <SupabaseClientContext.Provider value={client}>
      <UserContext.Provider value={user}>
        {children}
      </UserContext.Provider>
    </SupabaseClientContext.Provider>
  );
}
