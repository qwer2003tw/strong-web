import { redirect } from "next/navigation";
import { SignInForm } from "@/components/features/auth/sign-in-form";
import { getCurrentUser } from "@/lib/services/authService";

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/workouts");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <SignInForm />
    </div>
  );
}
