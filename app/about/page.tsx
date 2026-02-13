export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">About TealMart</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            TealMart is your trusted destination for discovering trending products from around the world.
            We curate the best items at competitive prices, ensuring quality and value in every purchase.
          </p>
          <p className="text-gray-700">
            Founded with a vision to make online shopping seamless and enjoyable, we combine cutting-edge
            technology with a customer-first approach to deliver an exceptional marketplace experience.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose TealMart?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-tiffany-600 text-2xl">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quality Guaranteed</h3>
                <p className="text-gray-700">
                  Every product is carefully vetted to meet our high quality standards.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-tiffany-600 text-2xl">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Competitive Pricing</h3>
                <p className="text-gray-700">
                  We work hard to bring you the best prices without compromising on quality.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-tiffany-600 text-2xl">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Secure Shopping</h3>
                <p className="text-gray-700">
                  Your security is our priority with encrypted transactions and secure checkout.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-tiffany-600 text-2xl">✓</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Customer Support</h3>
                <p className="text-gray-700">
                  Our dedicated team is here to help you with any questions or concerns.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h2>
          <p className="text-gray-700 mb-4">
            Have questions? We'd love to hear from you.
          </p>
          <a href="/contact" className="btn-primary inline-block">
            Contact Us
          </a>
        </div>
      </div>
    </div>
  )
}
