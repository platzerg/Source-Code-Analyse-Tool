'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const PUBLIC_PATHS = ['/login', '/signup']

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading) {
            const isPublicPath = PUBLIC_PATHS.includes(pathname)

            if (!user && !isPublicPath) {
                // Not logged in and trying to access private page -> redirect to login
                router.push('/login')
            } else if (user && isPublicPath) {
                // Logged in and trying to access login/signup -> redirect to dashboard
                router.push('/dashboard')
            }
        }
    }, [user, loading, pathname, router])

    // Show nothing while checking auth session to avoid flashing protected content
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
            </div>
        )
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname)

    // Render children only if:
    // 1. Not logged in but on a public path
    // 2. Logged in and on a private path
    if ((!user && isPublicPath) || (user && !isPublicPath)) {
        return <>{children}</>
    }

    // Default return null while redirecting
    return null
}
