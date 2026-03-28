/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns:[
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  // Suppress warnings for draft features if any
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
