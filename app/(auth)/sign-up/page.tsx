import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/features/auth/sign-up-form";
import { getCurrentSession } from "@/lib/services/authService";

export default async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/workouts");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <SignUpForm />
    </div>
  );
}
