/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns:[
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return[
      {
        // Reroute browsers looking for an old-school .ico file to your modern SVG
        source: '/favicon.ico',
        destination: '/logo.svg',
      },
      {
        // Reroute Facebook/Twitter looking for an OpenGraph image to your SVG
        source: '/og-image.png',
        destination: '/logo.svg', 
      }
    ]
  }
}

module.exports = nextConfig
