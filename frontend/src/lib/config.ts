/**
 * Configuration for API and Supabase connections
 * Uses environment variables with intelligent fallbacks based on NODE_ENV
 */

// Detect environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * API Base URL for client-side requests
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL from .env file
 * 2. Development: http://localhost:8000 (local backend)
 * 3. Production: http://localhost:8359 (Docker backend)
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isDevelopment ? 'http://localhost:8000' : 'http://localhost:8359');

/**
 * Supabase Configuration
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Configuration object for easy import
 */
export const config = {
  api: {
    baseUrl: API_BASE_URL,
  },
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  isDevelopment,
  isProduction,
} as const;
