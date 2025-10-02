import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/features/providers/app-providers";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { defaultLocale, getMessages } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strong Web",
  description: "Progressive workout companion powered by Supabase",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null = null;

  try {
    const result = await supabase.auth.getSession();
    session = result.data.session;
  } catch (error) {
    console.error('Failed to fetch Supabase session', error);
  }

  // Read locale from profiles table instead of user_metadata
  let preferredLocale = defaultLocale;
  if (session?.user?.id) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('locale')
        .eq('id', session.user.id)
        .single();

      if (profile?.locale) {
        preferredLocale = profile.locale as Locale;
      }
    } catch (error) {
      console.error('Failed to fetch user profile', error);
    }
  }

  const messages = await getMessages(preferredLocale);

  return (
    <html lang={preferredLocale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProviders session={session ?? null} messages={messages} locale={preferredLocale}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
