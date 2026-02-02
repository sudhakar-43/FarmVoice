/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  reactStrictMode: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
  },

  // API rewrites - only for local development
  async rewrites() {
    // In production, vercel.json handles API routing
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    // In development, proxy to local backend
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;


