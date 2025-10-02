"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useSupabaseClient } from "@/components/features/providers/supabase-session-provider";
import { validatePassword } from "@/lib/validation";

export function ResetPasswordForm() {
    const t = useTranslations();
    const router = useRouter();
    const supabase = useSupabaseClient();
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    async function handleResetPassword(formData: FormData) {
        const password = String(formData.get("password") ?? "");
        const confirmPassword = String(formData.get("confirmPassword") ?? "");

        if (!validatePassword(password)) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
        });

        if (updateError) {
            setError(updateError.message);
            return;
        }

        // Success - redirect to sign in
        router.push("/sign-in?reset=success");
    }

    return (
        <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-lg">
            <div>
                <h1 className="text-2xl font-semibold">{t("auth.resetPassword")}</h1>
                <p className="mt-1 text-sm text-slate-600">
                    {t("auth.resetPasswordDescription")}
                </p>
            </div>
            {error ? <Alert variant="error" message={error} /> : null}
            <form
                action={(formData) =>
                    startTransition(async () => {
                        setError(null);
                        await handleResetPassword(formData);
                    })
                }
                className="space-y-4"
            >
                <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.newPassword")}</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        disabled={pending}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        disabled={pending}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                    {t("auth.resetPassword")}
                </Button>
            </form>
        </div>
    );
}
