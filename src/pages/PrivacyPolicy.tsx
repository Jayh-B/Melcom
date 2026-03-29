import { Link } from 'react-router-dom';
import { Shield, ChevronRight } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900">Privacy Policy</span>
      </nav>

      <div className="bg-red-600 text-white rounded-3xl p-8 mb-10 flex items-start gap-4">
        <Shield size={32} className="shrink-0 mt-1" />
        <div>
          <h1 className="text-3xl font-black">Privacy Policy</h1>
          <p className="mt-2 text-red-100">
            Compliant with the Ghana Data Protection Act, 2012 (Act 843) and the Data Protection Regulation, 2016 (LI 2246).
          </p>
          <p className="text-red-200 text-sm mt-2">Last updated: January 2026 &nbsp;|&nbsp; Effective: January 2026</p>
        </div>
      </div>

      <div className="prose prose-gray max-w-none space-y-10">

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">1. Who We Are</h2>
          <p className="text-gray-600 leading-relaxed">
            Melcom Ghana Limited ("Melcom", "we", "us", or "our") operates the Melcom e-commerce platform at <strong>melcom.com.gh</strong>.
            We are registered as a data controller with the Data Protection Commission of Ghana under the Ghana Data Protection Act, 2012 (Act 843).
            Our registered address is Independence Avenue, Accra, Ghana. Contact our Data Protection Officer at <a href="mailto:dpo@melcom.com.gh" className="text-red-600 hover:underline">dpo@melcom.com.gh</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">2. Information We Collect</h2>
          <p className="text-gray-600 mb-3">We collect the following personal data when you use our platform:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>Account Information:</strong> Name, email address, phone number, and profile photo via Google Sign-In.</li>
            <li><strong>Purchase Data:</strong> Order history, shipping addresses, payment method type (we do not store full card or MoMo details).</li>
            <li><strong>Interaction Data:</strong> Products viewed, items added to cart, search queries, and wishlist items.</li>
            <li><strong>Device & Usage Data:</strong> IP address, browser type, pages visited, and time spent on the platform.</li>
            <li><strong>Communications:</strong> Messages sent to our customer support team.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">3. How We Use Your Information</h2>
          <p className="text-gray-600 mb-3">Under Act 843, we process your data on the following lawful bases:</p>
          <div className="space-y-3">
            {[
              ['Performance of Contract', 'To process your orders, arrange delivery, and provide customer support.'],
              ['Legitimate Interests', 'To personalise your shopping experience, improve our platform, and prevent fraud.'],
              ['Consent', 'To send you marketing communications and personalised promotions (you can withdraw consent at any time).'],
              ['Legal Obligation', 'To comply with Ghana Revenue Authority (GRA) tax obligations and applicable Ghanaian laws.'],
            ].map(([basis, desc]) => (
              <div key={basis} className="bg-gray-50 rounded-2xl p-4">
                <p className="font-bold text-gray-900 text-sm">{basis}</p>
                <p className="text-gray-600 text-sm mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">4. Data Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We do not sell your personal data. We share it only with:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li><strong>Google Firebase:</strong> Cloud infrastructure for authentication, database, and storage (servers located within GCP regions).</li>
            <li><strong>Paystack:</strong> Payment processing partner (PCI-DSS certified). We share only your email and transaction reference.</li>
            <li><strong>Delivery Partners:</strong> Your name, phone number, and address to fulfil delivery.</li>
            <li><strong>Ghana Revenue Authority:</strong> Tax records as required by the Electronic Transaction Levy Act and VAT Act.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">5. Your Rights Under Act 843</h2>
          <p className="text-gray-600 mb-3">As a data subject in Ghana, you have the right to:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ['Access', 'Request a copy of your personal data we hold.'],
              ['Correction', 'Request correction of inaccurate or outdated data.'],
              ['Deletion', 'Request deletion of your data where no legal obligation requires us to retain it.'],
              ['Objection', 'Object to processing based on legitimate interests.'],
              ['Portability', 'Receive your data in a machine-readable format.'],
              ['Withdraw Consent', 'Withdraw marketing consent at any time without affecting prior lawful processing.'],
            ].map(([right, desc]) => (
              <div key={right} className="border border-gray-200 rounded-2xl p-4">
                <p className="font-bold text-gray-900 text-sm">{right}</p>
                <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 mt-4 text-sm">
            To exercise your rights, email <a href="mailto:dpo@melcom.com.gh" className="text-red-600 hover:underline">dpo@melcom.com.gh</a>.
            We will respond within 21 days. You may also lodge a complaint with the{' '}
            <a href="https://dataprotection.org.gh" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Data Protection Commission of Ghana</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">6. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            We use cookies and similar technologies as described in our cookie consent banner. You can manage preferences at any time via the banner or by clearing your browser cookies.
            Functional cookies are strictly necessary and cannot be disabled. Analytics and marketing cookies require your consent.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">7. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed">
            We retain your account data for as long as your account is active or as needed to provide services.
            Order records and tax invoices are retained for <strong>7 years</strong> in compliance with GRA requirements.
            Interaction data used for personalisation is retained for <strong>12 months</strong> and then anonymised.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">8. Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement industry-standard security measures including TLS encryption, Firebase Security Rules, Role-Based Access Control (RBAC),
            and Firebase App Check to prevent unauthorised API access. Payment data is processed by Paystack under PCI-DSS Level 1 compliance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">9. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this policy periodically. We will notify you by email or prominent notice on the platform at least 14 days before significant changes take effect.
            Your continued use of the platform after that date constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-3">10. Contact Us</h2>
          <div className="bg-gray-50 rounded-2xl p-6 space-y-2 text-sm text-gray-600">
            <p><strong>Data Protection Officer:</strong> Melcom Ghana Limited</p>
            <p><strong>Address:</strong> Independence Avenue, Accra, Ghana</p>
            <p><strong>Email:</strong> <a href="mailto:dpo@melcom.com.gh" className="text-red-600 hover:underline">dpo@melcom.com.gh</a></p>
            <p><strong>Phone:</strong> +233 302 123456</p>
            <p><strong>DPC Registration:</strong> DPC-2024-0XXXXX</p>
          </div>
        </section>
      </div>
    </div>
  );
}
