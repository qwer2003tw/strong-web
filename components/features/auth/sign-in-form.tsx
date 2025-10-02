"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useSupabaseClient } from "@/components/features/providers/supabase-session-provider";
import { validateEmail, validatePassword } from "@/lib/validation";

const oauthProviders = ["github", "google"] as const;

export function SignInForm() {
  const t = useTranslations();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleEmailSignIn(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/workouts");
    router.refresh();
  }

  async function handleOAuthSignIn(provider: (typeof oauthProviders)[number]) {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/workouts`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-lg">
      <div>
        <h1 className="text-2xl font-semibold">{t("auth.signIn")}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("auth.noAccount")}{" "}
          <Link href="/sign-up" className="text-blue-600 hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
      {error ? <Alert variant="error" message={error} /> : null}
      <form
        action={(formData) =>
          startTransition(async () => {
            setError(null);
            await handleEmailSignIn(formData);
          })
        }
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {t("auth.signIn")}
        </Button>
      </form>
      <div className="space-y-3">
        <p className="text-center text-sm font-medium text-slate-500">{t("auth.oauth")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {oauthProviders.map((provider) => (
            <Button
              key={provider}
              variant="outline"
              type="button"
              disabled={pending}
              onClick={() => handleOAuthSignIn(provider)}
            >
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
