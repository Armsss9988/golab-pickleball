/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: '/', headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' }] }];
  },
  async rewrites() {
    const apiPort = process.env.API_PORT || '3021';
    return [{ source: '/api/:path*', destination: `http://localhost:${apiPort}/api/:path*` }];
  },
};

module.exports = nextConfig;
