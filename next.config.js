/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  reactStrictMode: true,
  
  // Compiler options to reduce bundle size
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Optimize heavy package imports
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons', 'recharts', '@react-three/drei', '@react-three/fiber'],
  },
  
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


