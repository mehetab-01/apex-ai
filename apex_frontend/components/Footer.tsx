"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Don't show footer on auth pages
  const hideOnPages = ["/login", "/register", "/onboarding"];
  if (hideOnPages.includes(pathname)) {
    return null;
  }

  return (
    <footer className="border-t border-white/5 py-12 bg-apex-darker/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-lg group-hover:bg-neon-cyan/30 transition-colors" />
                <img
                  src="https://i.ibb.co/ynDNpLjn/apex-learning.png"
                  alt="Apex Learning"
                  className="relative w-10 h-10 rounded-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  APEX
                </span>
                <span className="text-[10px] text-gray-500 -mt-1 tracking-wider">LEARNING</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500">
              AI-powered learning platform designed to help you reach your full potential.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/focus-mode" className="hover:text-white transition-colors">Focus Mode</Link></li>
              <li><Link href="/career" className="hover:text-white transition-colors">Career</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">AI Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2026 Apex Learning Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Made with love for learners everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
