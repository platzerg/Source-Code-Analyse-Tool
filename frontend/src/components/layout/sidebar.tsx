"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Folder, GitBranch, Settings, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Sidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r border-gray-100 hidden md:block">
            <div className="p-6">
                <Link href="/">
                    <h1 className="text-2xl font-bold text-red-700">.rca</h1>
                </Link>
            </div>
            <nav className="mt-6 px-4 space-y-2">
                {/* Home/Dashboard */}
                <Link
                    href="/"
                    className={cn(
                        "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                        pathname === "/"
                            ? "bg-red-700 text-white shadow-md shadow-red-200"
                            : "text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <Home className="w-5 h-5" />
                    <span>{t('navigation.dashboard')}</span>
                </Link>

                {/* Projects */}
                <Link
                    href="/projects"
                    className={cn(
                        "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                        isActive("/projects")
                            ? "bg-red-700 text-white shadow-md shadow-red-200"
                            : "text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <Folder className="w-5 h-5" />
                    <span>{t('navigation.projects')}</span>
                </Link>

                {/* Repositories */}
                <Link
                    href="/repositories"
                    className={cn(
                        "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                        isActive("/repositories")
                            ? "bg-red-700 text-white shadow-md shadow-red-200"
                            : "text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <GitBranch className="w-5 h-5" />
                    <span>{t('navigation.repositories')}</span>
                </Link>

                {/* Settings */}
                <Link
                    href="/settings"
                    className={cn(
                        "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                        isActive("/settings")
                            ? "bg-red-700 text-white shadow-md shadow-red-200"
                            : "text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <Settings className="w-5 h-5" />
                    <span>{t('navigation.settings')}</span>
                </Link>
            </nav>
        </aside>
    );
}
