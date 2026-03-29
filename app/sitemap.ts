// app/sitemap.ts
import { prisma } from '@/lib/db'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tealmart.vercel.app'

  // 1. Get Categories
  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: { isActive: true },
  })

  // 2. Define SEO Tiers
  const priceTiers = [25, 50, 100]
  const prefixes = ['best', 'top-rated', 'affordable', 'latest']

  // 3. Generate Collection Slugs
  const collectionPages: MetadataRoute.Sitemap = []
  
  categories.forEach((cat) => {
    const cleanCat = cat.category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')
    
    prefixes.forEach((prefix) => {
      // e.g., /collections/best-electronics
      collectionPages.push({
        url: `${baseUrl}/collections/${prefix}-${cleanCat}`,
        changeFrequency: 'daily',
        priority: 0.8,
      })

      priceTiers.forEach((price) => {
        // e.g., /collections/best-electronics-under-50
        collectionPages.push({
          url: `${baseUrl}/collections/${prefix}-${cleanCat}-under-${price}`,
          changeFrequency: 'daily',
          priority: 0.7,
        })
      })
    })
  })

  // 4. Standard Static & Product Pages
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
    take: 500,
  })

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: p.updatedAt,
    priority: 0.6,
  }))

  return [
    { url: baseUrl, priority: 1.0 },
    ...collectionPages,
    ...productPages
  ]
}
