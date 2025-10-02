"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useSupabaseClient } from "@/components/features/providers/supabase-session-provider";
import { validateEmail } from "@/lib/validation";

export function ForgotPasswordForm() {
    const t = useTranslations();
    const supabase = useSupabaseClient();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [pending, startTransition] = useTransition();

    async function handleForgotPassword(formData: FormData) {
        const email = String(formData.get("email") ?? "");

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
            return;
        }

        setSuccess(true);
    }

    if (success) {
        return (
            <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold">{t("auth.checkEmail")}</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        {t("auth.resetEmailSent")}
                    </p>
                    <Link
                        href="/sign-in"
                        className="mt-6 inline-block text-sm text-blue-600 hover:underline"
                    >
                        {t("auth.backToSignIn")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-lg">
            <div>
                <h1 className="text-2xl font-semibold">{t("auth.forgotPassword")}</h1>
                <p className="mt-1 text-sm text-slate-600">
                    {t("auth.forgotPasswordDescription")}
                </p>
            </div>
            {error ? <Alert variant="error" message={error} /> : null}
            <form
                action={(formData) =>
                    startTransition(async () => {
                        setError(null);
                        await handleForgotPassword(formData);
                    })
                }
                className="space-y-4"
                noValidate
            >
                <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        disabled={pending}
                        placeholder="you@example.com"
                    />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                    {t("auth.sendResetEmail")}
                </Button>
            </form>
            <div className="text-center text-sm">
                <Link href="/sign-in" className="text-blue-600 hover:underline">
                    {t("auth.backToSignIn")}
                </Link>
            </div>
        </div>
    );
}
