import { getSupabaseEnv } from "@/lib/env";

// Mock environment variables
const originalEnv = process.env;

describe("getSupabaseEnv", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns environment variables when all are present", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    const env = getSupabaseEnv();
    
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("test-service-key");
  });

  it("throws error when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    expect(() => getSupabaseEnv()).toThrow();
  });

  it("throws error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    expect(() => getSupabaseEnv()).toThrow();
  });

  it("allows SUPABASE_SERVICE_ROLE_KEY to be optional", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const env = getSupabaseEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });

  it("throws error when environment variables are empty strings", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";

    expect(() => getSupabaseEnv()).toThrow();
  });

  it("handles whitespace in environment variables", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = " https://test.supabase.co ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = " test-anon-key ";
    process.env.SUPABASE_SERVICE_ROLE_KEY = " test-service-key ";

    const env = getSupabaseEnv();
    
    // The function does not trim whitespace, returns as-is
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(" https://test.supabase.co ");
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(" test-anon-key ");
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe(" test-service-key ");
  });
});
