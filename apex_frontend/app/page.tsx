"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  BookOpen,
  Eye,
  Briefcase,
  Brain,
  ChevronRight,
  Play,
  Sparkles,
  Target,
  Users,
  Trophy,
  Clock,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Personalized course recommendations powered by advanced AI that adapts to your learning style",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Eye,
    title: "Smart Focus Mode",
    description: "Real-time attention tracking using computer vision to maximize your study sessions",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Briefcase,
    title: "Career Guidance",
    description: "Upload your resume and get AI-powered career path recommendations and skill gap analysis",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: Target,
    title: "AI Study Assistant",
    description: "24/7 AI tutor to answer questions, explain concepts, and guide your learning journey",
    gradient: "from-orange-500 to-red-600",
  },
];

const stats = [
  { value: "50K+", label: "Active Learners", icon: Users },
  { value: "500+", label: "Expert Courses", icon: BookOpen },
  { value: "95%", label: "Success Rate", icon: Trophy },
  { value: "24/7", label: "AI Support", icon: Clock },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    image: "https://i.pravatar.cc/100?img=1",
    content: "Apex transformed my career. The AI recommendations helped me focus on exactly what I needed to land my dream job.",
  },
  {
    name: "Marcus Johnson",
    role: "Data Scientist",
    image: "https://i.pravatar.cc/100?img=2",
    content: "The focus mode is incredible. I've doubled my learning efficiency since I started using it.",
  },
  {
    name: "Emily Rodriguez",
    role: "Product Manager",
    image: "https://i.pravatar.cc/100?img=3",
    content: "Finally, an e-learning platform that understands how people actually learn. The personalization is next level.",
  },
  {
    name: "David Kim",
    role: "Full Stack Developer",
    image: "https://i.pravatar.cc/100?img=4",
    content: "The AI tutor is like having a personal mentor available 24/7. It helped me master React in half the time.",
  },
  {
    name: "Lisa Thompson",
    role: "UX Designer at Meta",
    image: "https://i.pravatar.cc/100?img=5",
    content: "Career guidance feature analyzed my skills perfectly and suggested the exact courses I needed for my promotion.",
  },
  {
    name: "James Wilson",
    role: "Machine Learning Engineer",
    image: "https://i.pravatar.cc/100?img=6",
    content: "Best investment in my education. The focus tracking keeps me accountable and the AI recommendations are spot-on.",
  },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const dragStartX = useRef(0);
  const scrollStartPosition = useRef(0);

  // Duplicate testimonials for infinite scroll effect
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused || isDragging) return;

    const scrollSpeed = 1; // pixels per frame
    let animationId: number;

    const animate = () => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const maxScroll = container.scrollWidth / 3; // One set of testimonials

        setScrollPosition((prev) => {
          const newPosition = prev + scrollSpeed;
          // Reset to beginning when we've scrolled through one full set
          if (newPosition >= maxScroll) {
            return 0;
          }
          return newPosition;
        });
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isDragging]);

  // Apply scroll position
  useEffect(() => {
    if (scrollRef.current && !isDragging) {
      scrollRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition, isDragging]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    scrollStartPosition.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const delta = dragStartX.current - e.clientX;
    scrollRef.current.scrollLeft = scrollStartPosition.current + delta;
  };

  const handleMouseUp = () => {
    if (isDragging && scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging && scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
    setIsDragging(false);
    setIsPaused(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setIsPaused(true);
    dragStartX.current = e.touches[0].clientX;
    scrollStartPosition.current = scrollRef.current?.scrollLeft || 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const delta = dragStartX.current - e.touches[0].clientX;
    scrollRef.current.scrollLeft = scrollStartPosition.current + delta;
  };

  const handleTouchEnd = () => {
    if (isDragging && scrollRef.current) {
      setScrollPosition(scrollRef.current.scrollLeft);
    }
    setIsDragging(false);
    setIsPaused(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-cyan/10 via-transparent to-transparent" />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
            >
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm text-gray-300">The Future of Online Learning</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
            >
              <span className="text-white">Learn </span>
              <span className="bg-gradient-to-r from-neon-cyan via-cyan-400 to-neon-cyan bg-clip-text text-transparent">
                Smarter
              </span>
              <br />
              <span className="text-white">Not Harder</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
            >
              Experience AI-powered education that adapts to you. Smart recommendations, 
              focus tracking, and personalized career guidance—all in one platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {isAuthenticated ? (
                <Link 
                  href="/dashboard" 
                  className="group px-8 py-4 bg-neon-cyan text-black font-semibold rounded-full flex items-center gap-2 hover:shadow-lg hover:shadow-neon-cyan/25 transition-all"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link 
                    href="/register" 
                    className="group px-8 py-4 bg-neon-cyan text-black font-semibold rounded-full flex items-center gap-2 hover:shadow-lg hover:shadow-neon-cyan/25 transition-all"
                  >
                    Start Learning Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    href="/login" 
                    className="px-8 py-4 text-white font-medium rounded-full border border-white/20 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </Link>
                </>
              )}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-neon-cyan" />
                <span>Face-verified community</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>4.9/5 rating</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-neon-cyan rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5 bg-apex-darker/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-neon-cyan mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">Features</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with proven learning methodologies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-5`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-neon-cyan transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-apex-darker/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-4">
              Start Learning in 3 Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Account",
                description: "Sign up and complete face verification to join our authentic learning community",
                icon: Shield,
              },
              {
                step: "02",
                title: "Tell Us Your Goals",
                description: "Share your learning objectives and let our AI create your personalized path",
                icon: Target,
              },
              {
                step: "03",
                title: "Start Learning",
                description: "Dive into courses with AI guidance, focus tracking, and real-time support",
                icon: GraduationCap,
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-white/5 absolute -top-4 left-0">{item.step}</div>
                <div className="relative pt-14">
                  <div className="w-14 h-14 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-5 mt-2">
                    <item.icon className="w-7 h-7 text-neon-cyan" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4">
              Loved by Learners Worldwide
            </h2>
          </motion.div>

          {/* Infinite Scroll Carousel */}
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={handleMouseLeave}
          >
            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-apex-dark to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-apex-dark to-transparent z-10 pointer-events-none" />

            {/* Scrollable Container */}
            <div
              ref={scrollRef}
              className={`flex gap-6 overflow-x-hidden pb-4 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {duplicatedTestimonials.map((testimonial, index) => (
                <div
                  key={`${testimonial.name}-${index}`}
                  className="flex-shrink-0 w-[320px] p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-neon-cyan/30 transition-all select-none"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed select-none">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full pointer-events-none"
                      draggable={false}
                    />
                    <div>
                      <div className="font-medium text-white select-none">{testimonial.name}</div>
                      <div className="text-sm text-gray-500 select-none">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-12 md:p-16 rounded-3xl overflow-hidden text-center"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/20 via-neon-purple/10 to-neon-pink/20" />
            <div className="absolute inset-0 bg-apex-dark/80" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-neon-cyan" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                Join thousands of learners who are already using Apex to accelerate their careers and achieve their goals.
              </p>
              
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-neon-cyan text-black font-semibold rounded-full hover:shadow-lg hover:shadow-neon-cyan/25 transition-all"
                >
                  Continue Learning
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-neon-cyan text-black font-semibold rounded-full hover:shadow-lg hover:shadow-neon-cyan/25 transition-all"
                >
                  Get Started Free
                  <ChevronRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
