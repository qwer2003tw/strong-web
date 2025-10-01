"use client";

import { NextIntlClientProvider } from "next-intl";
import type { Session } from "@supabase/supabase-js";
import type { Messages } from "@/lib/i18n/config";
import { ThemeProvider } from "./theme-provider";
import { SupabaseSessionProvider } from "./supabase-session-provider";

interface AppProvidersProps {
  children: React.ReactNode;
  session: Session | null;
  messages: Messages;
  locale: string;
}

export function AppProviders({ children, session, messages, locale }: AppProvidersProps) {
  return (
    <SupabaseSessionProvider initialSession={session}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        <ThemeProvider>{children}</ThemeProvider>
      </NextIntlClientProvider>
    </SupabaseSessionProvider>
  );
}
