import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/db'
import { createMockSupabaseClient } from '@/lib/mockSupabase'

const useMockSupabase =
  process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === "true" ||
  process.env.USE_MOCK_SUPABASE === "true";

type ServerSupabaseClient = ReturnType<typeof createServerClient<Database>>;

export const createServerSupabaseClient = async () => {
  if (useMockSupabase) {
    return createMockSupabaseClient() as unknown as ServerSupabaseClient;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
};

export const createSupabaseRouteHandlerClient = createServerSupabaseClient;
