import Link from 'next/link'

const categories = [
  { name: 'Electronics', icon: '📱', slug: 'electronics' },
  { name: 'Fashion', icon: '👗', slug: 'fashion' },
  { name: 'Home & Garden', icon: '🏠', slug: 'home-garden' },
  { name: 'Sports', icon: '⚽', slug: 'sports' },
  { name: 'Beauty', icon: '💄', slug: 'beauty' },
  { name: 'Toys', icon: '🎮', slug: 'toys' },
]

export default function FeaturedCategories() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <div className="text-4xl mb-3">{category.icon}</div>
            <h3 className="font-semibold text-gray-900">{category.name}</h3>
          </Link>
        ))}
      </div>
    </section>
  )
}
