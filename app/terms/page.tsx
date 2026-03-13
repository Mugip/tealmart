// app/terms/page.tsx
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using TealMart, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To make purchases, you may need to create an account. You agree to:
            </p>                                                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Notify us immediately of unauthorized use</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Product Information</h2>
            <p className="text-gray-700 mb-4">
              We strive to provide accurate product descriptions and pricing. However:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Product colors may vary slightly from images</li>
              <li>We reserve the right to correct pricing errors</li>
              <li>Product availability is subject to change</li>
              <li>We may limit quantities purchased</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Orders and Payment</h2>
            <p className="text-gray-700 mb-4">
              By placing an order, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide valid payment information</li>
              <li>Pay all charges at prices in effect when ordered</li>
              <li>Allow us to charge your payment method</li>
              <li>Our right to refuse or cancel orders</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Shipping and Delivery</h2>
            <p className="text-gray-700 mb-4">
              Shipping times are estimates and not guaranteed. Title and risk of loss pass to you upon delivery to the carrier. See our Shipping Policy for details.
            </p>
          </section>

          <section className="mb-8">                              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Returns and Refunds</h2>
            <p className="text-gray-700 mb-4">
              We accept returns within 30 days of delivery for most items in original condition. See our Return Policy for complete details.                                  </p>
          </section>
                                                                <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Prohibited Uses</h2>
            <p className="text-gray-700 mb-4">
              You may not use our site to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful code or malware</li>
              <li>Engage in fraudulent activity</li>
              <li>Harass or harm others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">                      All content on TealMart, including text, graphics, logos, and images, is our property or our licensors' property and protected by copyright and trademark laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, TealMart shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>                                                </section>

          <section className="mb-8">                              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms, contact us at:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>Email: legal@tealmart.com</li>                    <li>Address: [Your Business Address]</li>
            </ul>
          </section>                                          </div>
      </div>                                              </div>
  )                                                   }
