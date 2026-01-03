// For client-side requests (browser -> backend)
// Defaults to localhost if not set, or uses the public URL
export const API_BASE_URL =
    typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8359/api/v1')
        : (process.env.INTERNAL_API_URL || 'http://backend:8000/api/v1');
