// app/shipping/page.tsx
import { Truck, Package, Globe, Clock, Shield, DollarSign } from 'lucide-react'

export const metadata = {
  title: 'Shipping Information | TealMart',
  description: 'Learn about our shipping policies, delivery times, and international shipping options.',
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Truck className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Shipping Information</h1>
          <p className="text-xl text-tiffany-100">
            Fast, reliable shipping to your doorstep
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Free Shipping Banner */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 mb-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold mb-2">Free Shipping on Orders Over $50!</h2>
          <p className="text-green-100">Enjoy free standard shipping on all qualifying orders</p>
        </div>

        {/* Shipping Options */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Package className="text-tiffany-600" />
            Shipping Options
          </h2>

          <div className="space-y-6">
            <div className="border-l-4 border-tiffany-500 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Standard Shipping</h3>
              <p className="text-gray-600 mb-2">5-7 business days</p>
              <p className="text-tiffany-600 font-bold">FREE on orders over $50 | $4.99 for orders under $50</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Express Shipping</h3>
              <p className="text-gray-600 mb-2">2-3 business days</p>
              <p className="text-purple-600 font-bold">$12.99</p>
            </div>

            <div className="border-l-4 border-orange-500 pl-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Overnight Shipping</h3>
              <p className="text-gray-600 mb-2">1 business day</p>
              <p className="text-orange-600 font-bold">$24.99</p>
            </div>
          </div>
        </section>

        {/* International Shipping */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Globe className="text-tiffany-600" />
            International Shipping
          </h2>

          <div className="space-y-4">
            <p className="text-gray-700">
              We ship to over 100 countries worldwide! International shipping rates are calculated at checkout based on your location and order weight.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">Customs & Duties</h3>
              <p className="text-gray-700 text-sm">
                International customers are responsible for any customs duties, taxes, or fees charged by your country. These fees are not included in your order total.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Canada & Mexico</h4>
                <p className="text-gray-600 text-sm">7-14 business days</p>
                <p className="text-tiffany-600 font-bold">Starting at $15.99</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Europe & UK</h4>
                <p className="text-gray-600 text-sm">10-21 business days</p>
                <p className="text-tiffany-600 font-bold">Starting at $19.99</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Asia & Pacific</h4>
                <p className="text-gray-600 text-sm">14-28 business days</p>
                <p className="text-tiffany-600 font-bold">Starting at $24.99</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Rest of World</h4>
                <p className="text-gray-600 text-sm">21-35 business days</p>
                <p className="text-tiffany-600 font-bold">Contact us for quote</p>
              </div>
            </div>
          </div>
        </section>

        {/* Processing Time */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Clock className="text-tiffany-600" />
            Processing & Delivery Time
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Order Processing</h3>
              <p className="text-gray-700">
                Orders are typically processed within 1-2 business days (Monday-Friday, excluding holidays). You'll receive a confirmation email with tracking information once your order ships.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Cut-off Time</h3>
              <p className="text-gray-700">
                Orders placed before 2:00 PM EST are processed the same business day. Orders placed after 2:00 PM EST will be processed the next business day.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-gray-700 text-sm">
                <strong>Note:</strong> During peak seasons (holidays, sales events), processing times may be extended by 1-2 business days. We'll notify you of any delays.
              </p>
            </div>
          </div>
        </section>

        {/* Tracking */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Shield className="text-tiffany-600" />
            Order Tracking & Security
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Track Your Order</h3>
              <p className="text-gray-700 mb-4">
                Once your order ships, you'll receive an email with a tracking number. You can track your package status 24/7 through:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Our order tracking page (login to your account)</li>
                <li>Direct carrier website using your tracking number</li>
                <li>Email notifications at key delivery milestones</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Package Security</h3>
              <p className="text-gray-700">
                All shipments are fully insured against loss or damage. If your package is lost or arrives damaged, please contact us immediately at{' '}
                <a href="mailto:support@tealmart.com" className="text-tiffany-600 hover:underline">
                  support@tealmart.com
                </a>
                {' '}and we'll resolve the issue promptly.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <h4 className="font-bold text-gray-900 mb-2">Signature Required?</h4>
              <p className="text-gray-700 text-sm">
                Orders over $500 require a signature upon delivery for security. For all other orders, packages will be left at your doorstep unless you request signature confirmation at checkout.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white rounded-2xl shadow-sm p-8">                                                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping FAQs</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Can I change my shipping address after placing an order?</h3>
              <p className="text-gray-700">
                Yes, if your order hasn't shipped yet. Contact us immediately at{' '}
                <a href="mailto:support@tealmart.com" className="text-tiffany-600 hover:underline">
                  support@tealmart.com
                </a>
                {' '}with your order number and new address.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Do you ship to P.O. boxes?</h3>
              <p className="text-gray-700">
                Yes, we ship to P.O. boxes for standard shipping only. Express and overnight shipping require a physical street address.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">What if I'm not home for delivery?</h3>
              <p className="text-gray-700">
                The carrier will leave a notice with instructions for redelivery or pickup. You can also arrange to have packages held at a local carrier facility for pickup.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Can I expedite an order that's already been placed?</h3>
              <p className="text-gray-700">
                If your order hasn't shipped yet, contact us and we'll upgrade your shipping method. Additional shipping fees will apply.
              </p>
            </div>
          </div>                                              </section>                                    
        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-tiffany-600 to-purple-600 text-white rounded-2xl p-8 mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>                                          <p className="mb-6 text-tiffany-100">
            Our customer support team is here to help!
          </p>                                                  <div className="flex flex-col sm:flex-row gap-4 justify-center">                                              <a
              href="/contact"
              className="inline-block px-8 py-3 bg-white text-tiffany-600 font-bold rounded-lg hover:shadow-lg transition-all"
            >                                                       Contact Support
            </a>
            <a
              href="/faq"                                           className="inline-block px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all"
            >
              View FAQ
            </a>
          </div>                                              </div>
      </div>                                              </div>
  )
}
