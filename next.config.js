// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ❌ REMOVED unoptimized: true
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
