import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { DashboardNav } from "@/components/features/navigation/dashboard-nav";
import { OfflineBanner } from "@/components/features/offline/offline-banner";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient();
  let session = null;
  try {
    const result = await supabase.auth.getSession();
    session = result.data.session;
  } catch (error) {
    console.error('Failed to fetch Supabase session', error);
  }

  if (!session) {
    if (process.env.E2E_BYPASS_AUTH === "true") {
      // Allow dashboard pages to render without redirect during end-to-end tests.
    } else {
      redirect("/sign-in");
    }
  }

  // Fetch user profile for display name
  let profile = null;
  if (session?.user?.id) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session.user.id)
        .single();
      profile = data;
    } catch (error) {
      console.error('Failed to fetch user profile', error);
    }
  }

  const userName = profile?.full_name || null;
  const userEmail = profile?.email || session?.user?.email || null;

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
