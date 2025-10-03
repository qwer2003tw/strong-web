import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/features/auth/sign-up-form";
import { getCurrentUser } from "@/lib/services/authService";

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/workouts");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <SignUpForm />
    </div>
  );
}
