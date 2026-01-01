/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NODE_ENV === 'development'
                    ? 'http://127.0.0.1:8000/api/:path*' // Local development
                    : 'http://backend:8000/api/:path*',  // Docker networking
            },
        ];
    },
};

export default nextConfig;
