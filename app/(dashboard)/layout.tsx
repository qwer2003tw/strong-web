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
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardNav />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <OfflineBanner />
        {children}
      </main>
    </div>
  );
}
