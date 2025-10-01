import {
  createRouteHandlerClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { cookies } from "next/headers";
import { Buffer } from "buffer";

const MOCK_SESSION_COOKIE = "__supabase_session_mock";

type ServerSupabaseClient = SupabaseClient<Database>;

const decodeMockSession = (value: string) => {
  try {
    const json = Buffer.from(value, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();
  const mockSessionCookie = cookieStore.get(MOCK_SESSION_COOKIE);

  if (mockSessionCookie) {
    const session = decodeMockSession(mockSessionCookie.value);

    if (session) {
      const mockClient = {
        auth: {
          getSession: async () => ({
            data: { session },
            error: null,
          }),
          getUser: async () => ({
            data: { user: session?.user ?? null },
            error: null,
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as Partial<ServerSupabaseClient> & { auth: ServerSupabaseClient["auth"] };

      return mockClient as ServerSupabaseClient;
    }
  }

  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

export const createSupabaseRouteHandlerClient = async () => {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};
