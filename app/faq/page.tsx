// app/faq/page.tsx
import { HelpCircle, Search, ShoppingCart, CreditCard, Truck, RotateCcw, Shield, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Frequently Asked Questions | TealMart',
  description: 'Find answers to common questions about ordering, shipping, returns, payments, and more.',
}

export default function FAQPage() {
  const faqs = [
    {
      category: 'Orders & Shopping',
      icon: ShoppingCart,
      questions: [
        {
          q: 'How do I place an order?',
          a: 'Browse our products, add items to your cart, and proceed to checkout. You\'ll need to provide shipping information and payment details. Once your order is confirmed, you\'ll receive an email confirmation.',
        },
        {
          q: 'Can I modify or cancel my order?',
          a: 'You can modify or cancel your order within 1 hour of placing it. Contact us immediately at support@tealmart.com with your order number. After 1 hour, orders enter processing and cannot be modified.',
        },
        {
          q: 'Do I need an account to shop?',
          a: 'No, you can checkout as a guest. However, creating an account allows you to track orders, save addresses, view order history, and enjoy faster checkout in the future.',
        },
        {
          q: 'How do I track my order?',
          a: 'Once your order ships, you\'ll receive an email with a tracking number. You can also log into your account and view order status in "My Orders".',
        },
        {
          q: 'What if an item is out of stock?',
          a: 'Out of stock items will show as "Out of Stock" on the product page. You can sign up for email notifications when the item becomes available again.',
        },
      ],
    },
    {
      category: 'Payments & Pricing',
      icon: CreditCard,
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, and Google Pay. All transactions are secure and encrypted.',
        },
        {
          q: 'When will I be charged?',
          a: 'Your payment method is charged when you place your order. For preorders, you\'ll be charged when the item ships.',
        },
        {
          q: 'Is it safe to use my credit card?',
          a: 'Absolutely! We use industry-standard SSL encryption and work with trusted payment processors (Stripe) to ensure your information is secure. We never store your full credit card details.',
        },
        {
          q: 'Do you offer price matching?',
          a: 'Yes! If you find an identical item at a lower price from an authorized retailer, contact us within 7 days of purchase with proof and we\'ll refund the difference.',
        },
        {
          q: 'Why was my payment declined?',
          a: 'Common reasons include: insufficient funds, incorrect billing information, or security holds from your bank. Try using a different payment method or contact your bank to authorize the transaction.',
        },
        {
          q: 'Do you charge sales tax?',
          a: 'Sales tax is calculated based on your shipping address and local tax laws. You\'ll see the exact amount before completing your purchase.',
        },
      ],
    },
    {
      category: 'Shipping & Delivery',
      icon: Truck,
      questions: [
        {
          q: 'How long does shipping take?',
          a: 'Standard shipping: 5-7 business days. Express shipping: 2-3 business days. Overnight: 1 business day. Processing takes 1-2 business days before shipment.',
        },
        {
          q: 'Do you offer free shipping?',
          a: 'Yes! Orders over $50 qualify for free standard shipping within the continental US. See our Shipping page for international rates.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes, we ship to over 100 countries worldwide. International shipping rates are calculated at checkout based on destination and package weight.',
        },
        {
          q: 'Can I change my shipping address?',
          a: 'Yes, if your order hasn\'t shipped yet. Contact us immediately at support@tealmart.com with your order number and new address.',
        },
        {
          q: 'What if my package is lost or stolen?',
          a: 'All shipments are insured. If your package shows as delivered but you didn\'t receive it, contact us within 48 hours and we\'ll file a claim and send a replacement.',
        },
        {
          q: 'Do you ship to P.O. boxes?',
          a: 'Yes, we ship to P.O. boxes via USPS for standard shipping. Express and overnight shipping require a physical street address.',
        },
      ],
    },
    {
      category: 'Returns & Refunds',
      icon: RotateCcw,
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 30-day money-back guarantee. Items must be unused, in original packaging, with tags attached. Some items (personalized, intimate apparel, final sale) are not eligible for return.',
        },
        {
          q: 'How do I start a return?',
          a: 'Log into your account, go to Order History, and click "Return Items". We\'ll email you a prepaid return label within 24 hours. See our Returns page for detailed instructions.',
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are processed within 3-5 business days after we receive your return. The money will appear in your account within 5-10 business days depending on your bank.',
        },
        {
          q: 'Can I exchange an item?',
          a: 'Yes! Select "Exchange" when initiating your return. We\'ll send your replacement immediately and you can return the original using our prepaid label.',
        },
        {
          q: 'Who pays for return shipping?',
          a: 'We provide free return shipping labels for all returns. Original shipping charges are non-refundable unless the return is due to our error.',
        },
        {
          q: 'What if I received the wrong item?',
          a: 'Contact us immediately at support@tealmart.com with photos. We\'ll send the correct item right away at no charge and provide a prepaid label for the return.',
        },
      ],
    },
    {
      category: 'Products & Quality',
      icon: Shield,
      questions: [
        {
          q: 'Are your products authentic?',
          a: 'Yes, 100%! We work directly with authorized distributors and manufacturers. All products come with authenticity guarantees and manufacturer warranties where applicable.',
        },
        {
          q: 'How do I know what size to order?',
          a: 'Each product page includes detailed size charts. Measure yourself and compare to our charts. If you\'re between sizes, we recommend sizing up. Contact us if you need sizing help!',
        },
        {
          q: 'Do products come with warranties?',
          a: 'Many products include manufacturer warranties. Check the product description for warranty details. We also offer our own satisfaction guarantee on all purchases.',
        },
        {
          q: 'Are product images accurate?',
          a: 'Yes, we use real product photos. However, colors may vary slightly due to monitor settings and lighting. If you receive an item that doesn\'t match the description, you can return it.',
        },
        {
          q: 'Can I request product details not listed?',
          a: 'Absolutely! Contact us with your question and we\'ll get you the information you need, usually within 24 hours.',
        },
      ],
    },
    {
      category: 'Account & Privacy',
      icon: MessageCircle,
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Sign Up" at the top of any page. You\'ll need an email address and password. Creating an account allows you to track orders and save your information for faster checkout.',
        },
        {
          q: 'I forgot my password. What do I do?',
          a: 'Click "Forgot Password" on the login page. Enter your email and we\'ll send you a password reset link within minutes.',
        },
        {
          q: 'How do I update my account information?',
          a: 'Log in and go to "Account Settings". You can update your email, password, addresses, and payment methods anytime.',
        },
        {
          q: 'Is my personal information secure?',
          a: 'Yes! We use industry-standard encryption and never sell your personal information. Read our Privacy Policy for complete details on how we protect and use your data.',
        },
        {
          q: 'How do I unsubscribe from emails?',
          a: 'Click the "Unsubscribe" link at the bottom of any email. You can also manage your email preferences in Account Settings.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes. Contact us at privacy@tealmart.com to request account deletion. We\'ll remove your personal information within 30 days, keeping only what\'s required by law.',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tiffany-600 to-purple-700 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-tiffany-100 mb-8">
            Quick answers to common questions
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 focus:ring-4 focus:ring-white/30 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {faqs.map((category, idx) => {
            const Icon = category.icon
            return (
              <a
                key={idx}
                href={`#${category.category.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-lg transition-all group"
              >
                <Icon className="w-10 h-10 text-tiffany-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-gray-900 text-sm">{category.category}</h3>
              </a>
            )
          })}
        </div>

        {/* FAQ Categories */}
        {faqs.map((category, catIdx) => {
          const Icon = category.icon
          return (
            <section
              key={catIdx}
              id={category.category.toLowerCase().replace(/\s+/g, '-')}
              className="mb-12"
            >
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 text-white p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{category.category}</h2>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="space-y-6">
                    {category.questions.map((faq, qIdx) => (
                      <div key={qIdx} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                          <span className="text-tiffany-600 flex-shrink-0">Q:</span>
                          <span>{faq.q}</span>
                        </h3>
                        <div className="pl-6">
                          <p className="text-gray-700 leading-relaxed">{faq.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )
        })}

        {/* Still Have Questions */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="mb-6 text-purple-100 max-w-2xl mx-auto">
            Can't find what you're looking for? Our customer support team is here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Contact Support
            </a>
            <a
              href="mailto:support@tealmart.com"
              className="inline-block px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all"
            >
              Email Us
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-sm text-purple-100">
              <strong>Customer Support Hours:</strong><br />
              Monday - Friday: 9:00 AM - 8:00 PM EST<br />
              Saturday - Sunday: 10:00 AM - 6:00 PM EST
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
