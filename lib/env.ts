const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type RequiredEnvKey = (typeof requiredEnv)[number];

type EnvShape = Record<RequiredEnvKey, string> & {
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export function getSupabaseEnv(): EnvShape {
  const env: Partial<EnvShape> = {};

  for (const key of requiredEnv) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    env[key] = value;
  }

  env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return env as EnvShape;
}
