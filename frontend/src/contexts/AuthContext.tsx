'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthContextType {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

// Check if mock auth is enabled (auto-enable if Supabase not configured)
const MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true' || !isSupabaseConfigured()

// Debug logging
console.log('🔍 Auth Configuration:', {
    MOCK_AUTH,
    NEXT_PUBLIC_MOCK_AUTH: process.env.NEXT_PUBLIC_MOCK_AUTH,
    isSupabaseConfigured: isSupabaseConfigured(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseClient: !!supabase
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock authentication for local development or when Supabase not configured
        if (MOCK_AUTH) {
            console.log('🔓 Mock Auth enabled - bypassing Supabase')
            setUser({
                id: 'mock-user-id',
                email: 'dev@localhost',
                created_at: new Date().toISOString(),
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                role: 'authenticated'
            } as User)
            setLoading(false)
            return
        }

        // Only use Supabase if configured
        if (!supabase) {
            console.warn('Supabase not configured, using mock auth')
            // Enable mock auth if Supabase is not configured
            console.log('🔓 Enabling mock auth due to missing Supabase config')
            setUser({
                id: 'mock-user-id',
                email: 'dev@localhost',
                created_at: new Date().toISOString(),
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                role: 'authenticated'
            } as User)
            setLoading(false)
            return
        }

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = async (email: string, password: string) => {
        if (MOCK_AUTH || !supabase) {
            console.log('🔓 Mock signIn - auto-authenticated')
            return
        }
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
    }

    const signUp = async (email: string, password: string) => {
        if (MOCK_AUTH || !supabase) {
            console.log('🔓 Mock signUp - auto-authenticated')
            return
        }
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        if (error) throw error
    }

    const signOut = async () => {
        if (MOCK_AUTH || !supabase) {
            console.log('🔓 Mock signOut - clearing mock user')
            setUser(null)
            return
        }
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
