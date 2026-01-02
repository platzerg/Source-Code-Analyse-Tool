'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import I18nProvider from "./i18n-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={cn(inter.className, "bg-gray-50 text-slate-900 antialiased")}>
                <AuthProvider>
                    <I18nProvider>
                        <AuthGuard>
                            <AppShell>{children}</AppShell>
                        </AuthGuard>
                    </I18nProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicPath = ['/login', '/signup'].includes(pathname);

    if (isPublicPath) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            {/* Main Content */}
            <main className="pl-0 md:pl-64 w-full min-h-screen">
                {children}
            </main>
        </div>
    );
}
