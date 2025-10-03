"use client";

import { NextIntlClientProvider } from "next-intl";
import type { User } from "@supabase/supabase-js";
import type { Messages } from "@/lib/i18n/config";
import { ThemeProvider } from "./theme-provider";
import { SupabaseSessionProvider } from "./supabase-session-provider";

interface AppProvidersProps {
  children: React.ReactNode;
  initialUser: User | null;
  messages: Messages;
  locale: string;
}

export function AppProviders({ children, initialUser, messages, locale }: AppProvidersProps) {
  return (
    <SupabaseSessionProvider initialUser={initialUser}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <ThemeProvider>{children}</ThemeProvider>
      </NextIntlClientProvider>
    </SupabaseSessionProvider>
  );
}
