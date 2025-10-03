import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/features/navigation/dashboard-nav";
import { OfflineBanner } from "@/components/features/offline/offline-banner";
import { getCurrentUser, getUserProfile } from "@/lib/services/authService";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    if (process.env.E2E_BYPASS_AUTH === "true") {
      // Allow dashboard pages to render without redirect during end-to-end tests.
    } else {
      redirect("/sign-in");
    }
  }

  let profile: Awaited<ReturnType<typeof getUserProfile>> | null = null;
  if (user?.id) {
    profile = await getUserProfile(user.id);
  }

  const userName = profile?.full_name || null;
  const userEmail = profile?.email || user?.email || null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userName={userName} userEmail={userEmail} />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <OfflineBanner />
        {children}
      </main>
    </div>
  );
}
