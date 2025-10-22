"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import type { Database, ThemePreference, UnitSystem } from "@/types/db";
import { useSupabaseClient } from "@/components/features/providers/supabase-session-provider";
import { useTheme } from "@/components/features/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { defaultLocale, locales } from "@/lib/i18n/config";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface SettingsPanelProps {
  profile: ProfileRow | null;
  userId: string;
}

export function SettingsPanel({ profile, userId }: SettingsPanelProps) {
  const t = useTranslations();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [unit, setUnit] = useState<UnitSystem>(profile?.unit_preference ?? "metric");
  const [locale, setLocale] = useState<string>(profile?.locale ?? defaultLocale);
  const [name, setName] = useState<string>(profile?.full_name ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const readOnly = !userId;
  const successStorageKey = "strong-web-settings-success";

  useEffect(() => {
    if (typeof window === "undefined" || message) {
      return;
    }

    if (typeof document !== "undefined") {
      const toastMessage = document.body.dataset.settingsToast;
      if (toastMessage) {
        setMessage(toastMessage);
        delete document.body.dataset.settingsToast;
        // 同時清除 localStorage，避免訊息重複顯示
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(successStorageKey);
        }
        return;
      }
    }

    const storedMessage = window.localStorage.getItem(successStorageKey);
    if (storedMessage) {
      setMessage(storedMessage);
      window.localStorage.removeItem(successStorageKey);
    }
  }, [message, successStorageKey]);

  // 自動清除成功訊息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
        // 清除所有可能的存儲位置
        if (typeof document !== "undefined") {
          delete document.body.dataset.settingsToast;
        }
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(successStorageKey);
        }
      }, 3000); // 3秒後自動清除

      return () => clearTimeout(timer);
    }
  }, [message, successStorageKey]);

  async function handleProfileSave() {
    setError(null);
    setMessage(null);

    if (!userId) {
      setError("Unable to resolve user");
      return;
    }

    // 記錄原始的語言設定，用於判斷是否需要完整重新載入
    const originalLocale = profile?.locale ?? defaultLocale;
    const localeChanged = locale !== originalLocale;

    // Get user email from auth
    const { data: { user } } = await supabase.auth.getUser();

    // Directly use Supabase client to update profile (client-side)
    const profileData = {
      id: userId,
      email: user?.email ?? null,
      full_name: name || null,
      locale,
      unit_preference: unit,
      theme,
      updated_at: new Date().toISOString(),
    } as any;

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(profileData);

    if (updateError) {
      console.error("Profile save failed", updateError);
      setError(updateError.message || "Unable to save profile");
      return;
    }

    setMessage("Settings updated");
    if (typeof document !== "undefined") {
      document.body.dataset.settingsToast = "Settings updated";
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(successStorageKey, "Settings updated");
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        } catch (cacheError) {
          console.debug("SettingsPanel: unable to clear caches after locale update", cacheError);
        }
      }

      // 如果語言有變更，使用完整頁面重新載入以清除所有快取
      if (localeChanged) {
        window.location.reload();
      } else {
        router.refresh();
      }
      return;
    }

    router.refresh();
  }

  async function handleExport() {
    const response = await fetch("/api/export");
    if (!response.ok) {
      setError("Unable to export data");
      return;
    }
    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `strong-web-export-${new Date().toISOString()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <Alert variant="error" message={error} /> : null}
          {message ? <Alert variant="success" message={message} /> : null}
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} disabled={readOnly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Select id="locale" value={locale} onChange={(event) => setLocale(event.target.value)} disabled={readOnly}>
              {locales.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">{t("settings.unit")}</Label>
            <Select
              id="unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value as UnitSystem)}
              disabled={readOnly}
            >
              <option value="metric">Metric (kg)</option>
              <option value="imperial">Imperial (lb)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme">{t("settings.theme")}</Label>
            <Select
              id="theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemePreference)}
              disabled={readOnly}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </div>
          <Button
            onClick={() =>
              startTransition(async () => {
                await handleProfileSave();
              })
            }
            disabled={pending || readOnly}
          >
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Download a copy of your workouts and exercises in JSON format.
          </p>
          <Button variant="outline" onClick={handleExport}>
            Export data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
