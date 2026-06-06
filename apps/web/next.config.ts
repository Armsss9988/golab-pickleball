import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const apiPort = process.env.API_PORT || '3021';
    return [
      {
        source: '/api/:path*',
        destination: `http://localhost:${apiPort}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
