// app/returns/page.tsx
import { RotateCcw, CheckCircle, XCircle, Package, Clock, DollarSign, AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Returns & Refunds | TealMart',
  description: 'Learn about our hassle-free return policy, refund process, and how to initiate a return.',
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <RotateCcw className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Returns & Refunds</h1>
          <p className="text-xl text-purple-100">
            30-day money-back guarantee on all orders
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Quick Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Clock className="w-12 h-12 text-tiffany-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">30-Day Window</h3>
            <p className="text-sm text-gray-600">Return within 30 days of delivery</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <DollarSign className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Full Refund</h3>
            <p className="text-sm text-gray-600">Get your money back, no questions asked</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Package className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">Free Returns</h3>
            <p className="text-sm text-gray-600">We provide a prepaid return label</p>
          </div>
        </div>

        {/* Return Policy */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Return Policy</h2>

          <div className="space-y-4">
            <p className="text-gray-700">
              We want you to love your purchase! If you're not completely satisfied, you can return most items within 30 days of delivery for a full refund.
            </p>

            <div className="bg-tiffany-50 border border-tiffany-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" />
                Items Eligible for Return
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Products in original, unused condition</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Items with original packaging and tags attached</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Returned within 30 days of delivery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Proof of purchase (order number or receipt)</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="text-red-600" />
                Items NOT Eligible for Return
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Personalized or custom-made items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Intimate apparel, underwear, or swimwear (for hygiene reasons)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Final sale or clearance items (marked as "final sale")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Opened beauty products, cosmetics, or personal care items</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Digital products or gift cards</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How to Return */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Return an Item</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-tiffany-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Initiate Your Return</h3>
                <p className="text-gray-700">
                  Log in to your account and go to "Order History". Click "Return Items" next to your order, or contact us at{' '}
                  <a href="mailto:returns@tealmart.com" className="text-tiffany-600 hover:underline">
                    returns@tealmart.com
                  </a>
                  {' '}with your order number.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-tiffany-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Print Your Return Label</h3>
                <p className="text-gray-700">
                  We'll email you a prepaid return shipping label within 24 hours. Print it out and attach it to your package.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-tiffany-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Pack Your Items</h3>
                <p className="text-gray-700">
                  Securely pack the item(s) in the original packaging if possible. Include all accessories, manuals, and tags. Remove or cover any old shipping labels.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-tiffany-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Ship Your Return</h3>
                <p className="text-gray-700">
                  Drop off your package at any authorized carrier location (USPS, UPS, FedEx). Keep your tracking receipt until your refund is processed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Receive Your Refund</h3>
                <p className="text-gray-700">
                  Once we receive and inspect your return (typically 3-5 business days), we'll process your refund. You'll receive your money back within 5-10 business days to your original payment method.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Refund Information */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Information</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Processing Time</h3>
              <p className="text-gray-700">
                Refunds are typically processed within 3-5 business days after we receive your return. You'll receive an email confirmation when your refund has been issued.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Refund Method</h3>
              <p className="text-gray-700 mb-2">
                Refunds are issued to your original payment method:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Credit/Debit Card: 5-10 business days</li>
                <li>PayPal: 3-5 business days</li>
                <li>Store Credit: Immediate (upon request)</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="text-blue-600" />
                Partial Refunds
              </h3>
              <p className="text-gray-700 text-sm">
                In some cases, we may issue partial refunds for items returned without original packaging, with signs of use, or missing accessories. We'll contact you before processing any partial refunds.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Shipping Costs</h3>
              <p className="text-gray-700">
                Original shipping charges are non-refundable unless the return is due to our error (wrong item, defective product, etc.). Return shipping is free when using our prepaid label.
              </p>
            </div>
          </div>
        </section>

        {/* Exchanges */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Exchanges</h2>

          <div className="space-y-4">
            <p className="text-gray-700">
              Need a different size or color? We offer free exchanges for the same item in a different variant!
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">How Exchanges Work</h3>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="font-bold text-purple-600">1.</span>
                  <span>Initiate a return and select "Exchange" as the reason</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-600">2.</span>
                  <span>Choose your replacement item (size, color, etc.)</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-600">3.</span>
                  <span>We'll send your replacement immediately</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-600">4.</span>
                  <span>Return your original item using the prepaid label</span>
                </li>
              </ol>
              <p className="text-sm text-gray-600 mt-4">
                <strong>Note:</strong> If the replacement item is more expensive, you'll be charged the difference. If it's less expensive, we'll refund the difference.
              </p>
            </div>
          </div>
        </section>

        {/* Damaged or Defective Items */}
        <section className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Damaged or Defective Items</h2>

          <div className="space-y-4">
            <p className="text-gray-700">
              We inspect all items before shipping, but if you receive a damaged or defective product, we'll make it right!
            </p>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">What to Do:</h3>
              <ol className="space-y-2 text-gray-700">
                <li>1. Contact us within 7 days of receiving the item</li>
                <li>2. Provide photos of the damage or defect</li>
                <li>3. Include your order number</li>
              </ol>
              <p className="text-sm text-gray-700 mt-4">
                We'll send you a replacement immediately at no charge, or issue a full refund including shipping costs. You may be asked to return the defective item using a prepaid label.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Contact Information</h3>
              <p className="text-gray-700">
                Email:{' '}
                <a href="mailto:returns@tealmart.com" className="text-tiffany-600 hover:underline">
                  returns@tealmart.com
                </a>
                <br />
                Subject: "Damaged/Defective Item - Order #[YOUR ORDER NUMBER]"
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Return FAQs</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Can I return sale or clearance items?</h3>
              <p className="text-gray-700">
                Items marked as "Final Sale" cannot be returned. All other sale items follow our standard 30-day return policy.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">What if I lost my return label?</h3>
              <p className="text-gray-700">
                No problem! Contact us and we'll resend it to you within 24 hours.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Can I return items purchased with a gift card?</h3>
              <p className="text-gray-700">
                Yes! Refunds for gift card purchases will be issued back to the gift card or as store credit.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">How do I track my return?</h3>
              <p className="text-gray-700">
                Use the tracking number on your return label to track your package. We'll also send you email updates when we receive and process your return.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">What if my return is lost in transit?</h3>
              <p className="text-gray-700">
                Returns using our prepaid label are fully insured. If your return is lost, contact us with your tracking number and we'll process your refund immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help with a Return?</h2>
          <p className="mb-6 text-purple-100">
            Our customer service team is ready to assist you!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:returns@tealmart.com"
              className="inline-block px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Email Us
            </a>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
