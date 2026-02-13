import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-tiffany-500 to-tiffany-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Discover Amazing Products at Unbeatable Prices
          </h1>
          <p className="text-xl mb-8 text-tiffany-50">
            Shop trending items from around the world. Quality products, competitive prices, delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/products" 
              className="bg-white text-tiffany-600 hover:bg-tiffany-50 font-semibold py-3 px-8 rounded-lg transition-colors text-center"
            >
              Shop Now
            </Link>
            <Link 
              href="/categories" 
              className="bg-transparent border-2 border-white hover:bg-white hover:text-tiffany-600 font-semibold py-3 px-8 rounded-lg transition-colors text-center"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" 
            className="fill-katak-50"
          />
        </svg>
      </div>
    </section>
  )
}
