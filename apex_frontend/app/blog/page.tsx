"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { blogPosts } from "@/lib/blogData";

export default function BlogPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    // Simulate storing email (in real app, this would call an API)
    try {
      // Store in localStorage for demo purposes
      const subscribers = JSON.parse(localStorage.getItem("newsletter_subscribers") || "[]");

      if (subscribers.includes(email)) {
        setError("This email is already subscribed!");
        setIsSubmitting(false);
        return;
      }

      subscribers.push(email);
      localStorage.setItem("newsletter_subscribers", JSON.stringify(subscribers));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsSubscribed(true);
      setEmail("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">Blog</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mt-4 mb-6">
            Insights & Resources
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Learn effective study techniques, boost your productivity, and accelerate your learning with our expert guides.
          </p>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Link href={`/blog/${post.slug}`}>
                <div className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-neon-cyan/30 transition-all h-full flex flex-col">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 text-xs font-medium bg-neon-cyan/10 text-neon-cyan rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-cyan transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 text-sm mb-4 flex-grow line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-neon-cyan font-medium">
                        Read
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-white/10 rounded-3xl p-8 md:p-12 text-center"
        >
          <AnimatePresence mode="wait">
            {isSubscribed ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-4"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-green/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-neon-green" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">You're Subscribed!</h2>
                <p className="text-gray-400 mb-4">
                  Thanks for subscribing. You'll receive our latest articles and learning tips.
                </p>
                <button
                  onClick={() => setIsSubscribed(false)}
                  className="text-neon-cyan hover:underline text-sm"
                >
                  Subscribe another email
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
                <p className="text-gray-400 mb-6">Get the latest articles and learning tips delivered to your inbox.</p>
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan transition-colors"
                      disabled={isSubmitting}
                    />
                    {error && (
                      <p className="text-red-400 text-sm mt-2 text-left pl-4">{error}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-neon-cyan text-black font-medium rounded-full hover:shadow-lg hover:shadow-neon-cyan/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
