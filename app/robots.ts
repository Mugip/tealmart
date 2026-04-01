// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tealmart.vercel.app'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/products/', '/categories/'],
      disallow: ['/admin/', '/api/', '/checkout/', '/cart/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
