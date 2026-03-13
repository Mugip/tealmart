// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">                                <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
                                                              <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us when you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Create an account</li>
              <li>Make a purchase</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact customer support</li>
              <li>Interact with our website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping updates</li>
              <li>Provide customer support</li>
              <li>Improve our products and services</li>
              <li>Send marketing communications (with your consent)</li>
              <li>Detect and prevent fraud</li>                   </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Service Providers:</strong> Payment processors (Stripe), shipping partners, email service providers</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">                                                       <li>Encryption of data in transit and at rest</li>
              <li>Secure payment processing through Stripe</li>
              <li>Regular security audits</li>
              <li>Limited access to personal information</li>
            </ul>                                               </section>                                  
          <section className="mb-8">                              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 mb-4">                      You have the right to:
            </p>                                                  <ul className="list-disc pl-6 text-gray-700 space-y-2">                                                       <li>Access your personal information</li>                                                                   <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>                                                               <li>Opt-out of marketing communications</li>                                                                <li>Export your data</li>
            </ul>
          </section>                                  
          <section className="mb-8">                              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to improve your browsing experience, analyze site traffic, and personalize content. You can control cookies through your browser settings.
            </p>                                                </section>                                                                                                  <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13.                                    </p>                                                </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-none text-gray-700 space-y-2">
              <li>Email: privacy@tealmart.com</li>                  <li>Address: [Your Business Address]</li>
            </ul>
          </section>
        </div>                                              </div>
    </div>
  )
}
