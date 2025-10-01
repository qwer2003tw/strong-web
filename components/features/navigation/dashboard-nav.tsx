"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/features/navigation/sign-out-button";

const links = [
  { href: "/workouts", label: "nav.workouts" },
  { href: "/exercises", label: "nav.exercises" },
  { href: "/settings", label: "nav.settings" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/workouts" className="text-lg font-semibold">
          {t("app.name")}
        </Link>
        <nav className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-slate-600 hover:text-slate-900",
                pathname.startsWith(link.href) && "text-slate-900"
              )}
            >
              {t(link.label)}
            </Link>
          ))}
          <SignOutButton>
            <Button variant="ghost" className="text-sm">
              {t("nav.signOut")}
            </Button>
          </SignOutButton>
        </nav>
      </div>
    </header>
  );
}
