"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, Share2, Bookmark, MessageCircle, Send, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { getBlogPost, blogPosts } from "@/lib/blogData";
import { useAuth } from "@/contexts/AuthContext";

// Sample comments data (in real app, this would come from API)
const sampleComments = [
  {
    id: 1,
    author: "Alex Thompson",
    avatar: "https://i.pravatar.cc/100?img=11",
    date: "2 days ago",
    content: "This article is incredibly helpful! I've been struggling with focus for years and the tips about environment design really resonated with me. Going to try the Pomodoro technique starting today.",
  },
  {
    id: 2,
    author: "Sarah Kim",
    avatar: "https://i.pravatar.cc/100?img=5",
    date: "1 week ago",
    content: "Great insights! I'd add that having a consistent sleep schedule has been game-changing for my study sessions. Would love to see an article specifically about the connection between sleep and learning.",
  },
  {
    id: 3,
    author: "Marcus Chen",
    avatar: "https://i.pravatar.cc/100?img=12",
    date: "2 weeks ago",
    content: "I've been using spaced repetition for about 3 months now and can confirm it works amazingly well. Anki has become my best friend for learning new programming concepts.",
  },
];

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = getBlogPost(slug);
  const { isAuthenticated, user } = useAuth();
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(sampleComments);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!post) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-gray-400 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link href="/blog" className="text-neon-cyan hover:underline">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }

    if (!comment.trim()) return;

    const newComment = {
      id: comments.length + 1,
      author: user?.full_name || "Anonymous",
      avatar: user?.display_picture || user?.profile_picture || `https://i.pravatar.cc/100?img=${Math.floor(Math.random() * 70)}`,
      date: "Just now",
      content: comment,
    };

    setComments([newComment, ...comments]);
    setComment("");
  };

  const handleCommentFocus = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
    }
  };

  // Get related posts (same category, excluding current)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 2);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 text-xs font-medium bg-neon-cyan/10 text-neon-cyan rounded-full">
              {post.category}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {post.date}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {post.title}
          </h1>

          <p className="text-xl text-gray-400 mb-8">
            {post.excerpt}
          </p>

          {/* Author */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full border-2 border-neon-cyan/20"
              />
              <div>
                <div className="font-medium text-white">{post.author.name}</div>
                <div className="text-sm text-gray-500">{post.author.role}</div>
              </div>
            </div>

            {/* Share Actions */}
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Bookmark className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 rounded-2xl overflow-hidden"
        >
          <img
            src={post.image}
            alt={post.title}
            className="w-full aspect-video object-cover"
          />
        </motion.div>

        {/* Article Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert prose-cyan max-w-none mb-16"
        >
          <div className="text-gray-300 leading-relaxed space-y-6">
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-white mt-10 mb-4">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-white mt-8 mb-3">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 space-y-2 text-gray-300 mb-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 space-y-2 text-gray-300 mb-4">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-300">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="text-white font-semibold">{children}</strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-neon-cyan pl-4 italic text-gray-400 my-6">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </motion.article>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-12 pb-12 border-b border-white/10"
        >
          <span className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-400">
            #{post.category.toLowerCase().replace(/\s+/g, '')}
          </span>
          <span className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-400">
            #learning
          </span>
          <span className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-400">
            #education
          </span>
          <span className="px-4 py-2 bg-white/5 rounded-full text-sm text-gray-400">
            #apex
          </span>
        </motion.div>

        {/* Comments Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="flex items-center gap-2 mb-8">
            <MessageCircle className="w-6 h-6 text-neon-cyan" />
            <h2 className="text-2xl font-bold text-white">Comments ({comments.length})</h2>
          </div>

          {/* Comment Form */}
          <div className="mb-8 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            {showLoginPrompt && !isAuthenticated ? (
              <div className="text-center py-6">
                <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Login to Comment</h3>
                <p className="text-gray-400 mb-4">Join the conversation by signing in to your account.</p>
                <div className="flex items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className="px-6 py-2 bg-neon-cyan text-black font-medium rounded-full hover:shadow-lg hover:shadow-neon-cyan/25 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 transition-all"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCommentSubmit}>
                <div className="flex items-start gap-4">
                  {isAuthenticated ? (
                    <img
                      src={user?.display_picture || user?.profile_picture || "https://i.pravatar.cc/100?img=70"}
                      alt="Your avatar"
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onFocus={handleCommentFocus}
                      placeholder={isAuthenticated ? "Share your thoughts..." : "Sign in to comment..."}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan resize-none"
                      disabled={!isAuthenticated}
                    />
                    {isAuthenticated && (
                      <div className="flex justify-end mt-3">
                        <button
                          type="submit"
                          disabled={!comment.trim()}
                          className="flex items-center gap-2 px-5 py-2 bg-neon-cyan text-black font-medium rounded-full hover:shadow-lg hover:shadow-neon-cyan/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          Post Comment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((c, index) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex gap-4 p-4 bg-white/[0.02] rounded-xl"
              >
                <img
                  src={c.avatar}
                  alt={c.author}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white">{c.author}</span>
                    <span className="text-xs text-gray-500">{c.date}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{c.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                  <div className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-neon-cyan/30 transition-all">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-neon-cyan transition-colors">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">{relatedPost.readTime}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
