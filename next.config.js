/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['localhost'],
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
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;


