import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Helper to check if Supabase is properly configured
// Returns false if credentials are missing, empty, or contain placeholder values
export const isSupabaseConfigured = (): boolean => {
    if (!supabaseUrl || !supabaseAnonKey) return false

    // Check for placeholder values that indicate Supabase is not configured
    const placeholderPatterns = [
        'your-project.supabase.co',
        'your-anon-key',
        'your_supabase',
        'example.com'
    ]

    const hasPlaceholder = placeholderPatterns.some(pattern =>
        supabaseUrl.includes(pattern) || supabaseAnonKey.includes(pattern)
    )

    return !hasPlaceholder
}

// Make Supabase optional - return null if credentials not properly configured
// This allows the app to work without Supabase (using backend API only)
export const supabase: SupabaseClient | null =
    isSupabaseConfigured()
        ? createClient(supabaseUrl!, supabaseAnonKey!)
        : null
