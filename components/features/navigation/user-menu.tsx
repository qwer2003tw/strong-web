"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/features/navigation/sign-out-button";

interface UserMenuProps {
    userName?: string | null;
    userEmail?: string | null;
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Get initials for avatar
    const getInitials = () => {
        if (userName) {
            return userName.charAt(0).toUpperCase();
        }
        if (userEmail) {
            return userEmail.charAt(0).toUpperCase();
        }
        return "U";
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isOpen]);

    const displayName = userName || userEmail?.split("@")[0] || "User";

    return (
        <div className="relative" ref={menuRef}>
            {/* Avatar button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="User menu"
                aria-expanded={isOpen}
            >
                {getInitials()}
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-slate-800 dark:ring-slate-700">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {displayName}
                        </p>
                        {userEmail && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                {userEmail}
                            </p>
                        )}
                    </div>
                    <div className="py-1">
                        <Link
                            href="/settings"
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                            onClick={() => setIsOpen(false)}
                        >
                            {t("nav.settings")}
                        </Link>
                        <div className="border-t border-slate-200 dark:border-slate-700">
                            <SignOutButton>
                                <button className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
                                    {t("nav.signOut")}
                                </button>
                            </SignOutButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
