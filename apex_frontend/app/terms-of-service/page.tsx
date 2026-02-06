"use client";

import { motion } from "framer-motion";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">Legal</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-400">Last updated: January 1, 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-cyan max-w-none"
        >
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing or using Apex Learning ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p>
                Apex Learning is an AI-powered e-learning platform that provides online courses, personalized learning recommendations, focus tracking tools, and career guidance services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 13 years old to use this Service.</li>
                <li>You are responsible for maintaining the confidentiality of your account.</li>
                <li>You agree to provide accurate and complete information when creating your account.</li>
                <li>You are responsible for all activities that occur under your account.</li>
                <li>You must notify us immediately of any unauthorized use of your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Upload malicious code or content</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Infringe on intellectual property rights</li>
                <li>Use automated tools to access the Service without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by Apex Learning and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. User Content</h2>
              <p>
                You retain ownership of any content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content in connection with the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Payment Terms</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Some features require a paid subscription.</li>
                <li>Payments are processed through secure third-party providers.</li>
                <li>Subscriptions auto-renew unless cancelled before the renewal date.</li>
                <li>Refunds are available within 14 days of purchase if you haven't completed more than 25% of any course.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
              <p>
                The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
              <p>
                In no event shall Apex Learning be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
              <p>
                If you have questions about these Terms, please contact us at:
              </p>
              <p className="mt-2">
                <strong className="text-white">Email:</strong> legal@apexlearning.com<br />
                <strong className="text-white">Address:</strong> 123 Learning Street, San Francisco, CA 94102
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
