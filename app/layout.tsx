import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/features/providers/app-providers";
import { defaultLocale, getMessages } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { getCurrentSession, getUserProfile } from "@/lib/services/authService";
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
  const session = await getCurrentSession();
  let preferredLocale: Locale = defaultLocale;

  if (session?.user?.id) {
    const profile = await getUserProfile(session.user.id);
    if (profile?.locale) {
      preferredLocale = profile.locale as Locale;
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
