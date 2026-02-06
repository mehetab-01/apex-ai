"use client";

import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
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
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                At Apex Learning, we collect information to provide better services to our users. The types of information we collect include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Account Information:</strong> Name, email address, phone number, and profile picture when you create an account.</li>
                <li><strong className="text-white">Usage Data:</strong> Information about how you use our platform, including courses viewed, time spent, and progress.</li>
                <li><strong className="text-white">Face Data:</strong> For focus mode features, we process facial data locally on your device to track attention. This data is not stored or transmitted to our servers.</li>
                <li><strong className="text-white">Device Information:</strong> Browser type, operating system, and device identifiers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Personalize your learning experience with AI-powered recommendations</li>
                <li>Communicate with you about updates, features, and support</li>
                <li>Analyze usage patterns to improve our platform</li>
                <li>Protect against fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Information Sharing</h2>
              <p className="mb-4">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Service providers who assist in operating our platform</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong className="text-white">Email:</strong> privacy@apexlearning.com<br />
                <strong className="text-white">Address:</strong> 123 Learning Street, San Francisco, CA 94102
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
