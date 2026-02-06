"use client";

import { motion } from "framer-motion";

export default function CookiePolicyPage() {
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
            Cookie Policy
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
              <h2 className="text-2xl font-semibold text-white mb-4">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Cookies</h2>
              <p className="mb-4">Apex Learning uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Essential Cookies:</strong> Required for the website to function properly. These include cookies that enable you to log in and access secure areas.</li>
                <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
                <li><strong className="text-white">Functionality Cookies:</strong> Remember your preferences and settings to enhance your experience.</li>
                <li><strong className="text-white">Performance Cookies:</strong> Collect information about how you use our website to help us improve it.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Types of Cookies We Use</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full mt-4">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white">Cookie Name</th>
                      <th className="text-left py-3 px-4 text-white">Purpose</th>
                      <th className="text-left py-3 px-4 text-white">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">session_id</td>
                      <td className="py-3 px-4">User authentication</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">preferences</td>
                      <td className="py-3 px-4">Store user preferences</td>
                      <td className="py-3 px-4">1 year</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">analytics_id</td>
                      <td className="py-3 px-4">Anonymous analytics</td>
                      <td className="py-3 px-4">2 years</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4">csrf_token</td>
                      <td className="py-3 px-4">Security</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Cookies</h2>
              <p className="mb-4">
                We may use third-party services that set their own cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Google Analytics:</strong> For website analytics</li>
                <li><strong className="text-white">Stripe:</strong> For payment processing</li>
                <li><strong className="text-white">Intercom:</strong> For customer support chat</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Managing Cookies</h2>
              <p className="mb-4">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Browser Settings:</strong> Most browsers allow you to refuse or accept cookies through their settings.</li>
                <li><strong className="text-white">Our Cookie Banner:</strong> When you first visit our site, you can choose which cookies to accept.</li>
                <li><strong className="text-white">Third-Party Tools:</strong> You can opt out of third-party cookies through their respective websites.</li>
              </ul>
              <p className="mt-4">
                Please note that disabling certain cookies may affect the functionality of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Changes to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Us</h2>
              <p>
                If you have questions about our use of cookies, please contact us at:
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
