import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Make Supabase optional - return null if credentials not provided
// This allows the app to work without Supabase (using backend API only)
export const supabase: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => supabase !== null
