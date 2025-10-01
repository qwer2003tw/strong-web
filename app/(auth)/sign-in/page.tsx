import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { SignInForm } from "@/components/features/auth/sign-in-form";

export default async function SignInPage() {
  const supabase = await createServerSupabaseClient();
  let session = null;
  try {
    const result = await supabase.auth.getSession();
    session = result.data.session;
  } catch (error) {
    console.error('Failed to fetch Supabase session', error);
  }

  if (session) {
    redirect("/workouts");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <SignInForm />
    </div>
  );
}
