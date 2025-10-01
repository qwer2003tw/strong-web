"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSupabaseClient } from "@/components/features/providers/supabase-session-provider";

interface SignOutButtonProps {
  children: React.ReactNode;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await supabase.auth.signOut();
          router.replace("/sign-in");
          router.refresh();
        })
      }
      disabled={pending}
      className="disabled:opacity-60"
    >
      {children}
    </button>
  );
}
