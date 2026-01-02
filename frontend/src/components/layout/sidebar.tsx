"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Folder, GitBranch, Settings, Home, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();
    const { user, signOut } = useAuth();

    const isActive = (path: string) => pathname?.startsWith(path);

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-sm border-r border-gray-100 hidden md:block flex flex-col">
            <div className="p-6">
                <Link href="/dashboard">
                    <h1 className="text-2xl font-bold text-red-700">.rca</h1>
                </Link>
            </div>
            <nav className="mt-6 px-4 space-y-2 flex-1">
                {/* Home/Dashboard */}
                <Link
                    href="/dashboard"
                    className={cn(
                        "w-full flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                        isActive("/dashboard")
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

            {/* User Menu */}
            {user && (
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                        {/* User Avatar */}
                        <div className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center font-semibold flex-shrink-0">
                            {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user.email}
                            </p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Abmelden"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
