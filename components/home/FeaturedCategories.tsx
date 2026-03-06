// components/home/FeaturedCategories.tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface Category {
  name: string
  count: number
  slug: string
}

interface FeaturedCategoriesProps {
  categories: Category[]
}

// Icon mapping for categories
const categoryIcons: Record<string, string> = {
  'phone': '📱',
  'computer': '💻',
  'audio': '🎧',
  'camera': '📷',
  'shoes': '👟',
  'bags': '🎒',
  'watches': '⌚',
  'jewelry': '💎',
  'beauty': '💄',
  'home-garden': '🏡',
  'kitchen': '🍳',
  'toys': '🎮',
  'baby': '👶',
  'sports': '⚽',
  'fitness': '💪',
  'pets': '🐾',
  'electronics': '⚡',
  'fashion': '👗',
  'general': '🛍️',
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
        <p className="text-gray-600 text-lg">Explore our {categories.length} popular categories</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const displayName = category.name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
          
          const icon = categoryIcons[category.name] || categoryIcons['general']

          return (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-xl hover:border-tiffany-300 hover:-translate-y-1 transition-all"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-1 group-hover:text-tiffany-600 transition-colors">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500">{category.count} products</p>
            </Link>
          )
        })}
      </div>

      <div className="text-center mt-12">
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white font-bold rounded-xl hover:shadow-lg transition-all group"
        >
          View All Categories
          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
        </Link>
      </div>
    </section>
  )
}
