"use client";

import { useRouter } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  useTransition,
} from "react";
import { useSupabaseClient } from "@/components/features/providers/supabase-session-provider";

interface SignOutButtonProps {
  children: ReactElement;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isValidElement(children)) {
    throw new Error("SignOutButton expects a single React element child.");
  }

  function handleClick(event: MouseEvent<HTMLElement>) {
    if (typeof children.props.onClick === "function") {
      children.props.onClick(event);
    }
    if (event.defaultPrevented) {
      return;
    }

    startTransition(async () => {
      await supabase.auth.signOut();
      router.replace("/sign-in");
      router.refresh();
    });
  }

  return cloneElement(children, {
    onClick: handleClick,
    disabled: Boolean(children.props.disabled) || pending,
  });
}
