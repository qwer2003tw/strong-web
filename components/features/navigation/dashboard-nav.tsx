"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/features/navigation/user-menu";

const links = [
  { href: "/workouts", label: "nav.workouts" },
  { href: "/history", label: "nav.history" },
  { href: "/exercises", label: "nav.exercises" },
];

interface DashboardNavProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function DashboardNav({ userName, userEmail }: DashboardNavProps) {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
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
                "text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100",
                pathname.startsWith(link.href) && "text-slate-900 dark:text-slate-100"
              )}
            >
              {t(link.label)}
            </Link>
          ))}
          <UserMenu userName={userName} userEmail={userEmail} />
        </nav>
      </div>
    </header>
  );
}
