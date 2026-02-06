"use client";

import { motion } from "framer-motion";
import { Users, Target, Heart, Zap } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We believe education should be accessible, personalized, and effective for everyone.",
  },
  {
    icon: Heart,
    title: "Student-First",
    description: "Every feature we build starts with one question: How does this help learners succeed?",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We leverage cutting-edge AI to create learning experiences that were impossible before.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Learning is better together. We foster a supportive community of lifelong learners.",
  },
];

const team = [
  {
    name: "Mehetab Shaaz",
    role: "Founder & CEO",
    image: "https://i.pravatar.cc/150?img=11",
  },
  {
    name: "Alex Thompson",
    role: "CTO",
    image: "https://i.pravatar.cc/150?img=12",
  },
  {
    name: "Sarah Kim",
    role: "Head of AI",
    image: "https://i.pravatar.cc/150?img=5",
  },
  {
    name: "David Chen",
    role: "Head of Product",
    image: "https://i.pravatar.cc/150?img=8",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">About Us</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mt-4 mb-6">
            Transforming Education with AI
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Apex Learning was founded with a simple belief: everyone deserves access to personalized,
            high-quality education. We're building the future of learning, one student at a time.
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-24"
        >
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                Apex Learning started in 2024 when our founder experienced firsthand the limitations
                of traditional online learning. Generic courses, no personalization, and zero
                accountability led to abandoned courses and unfulfilled potential.
              </p>
              <p>
                We asked ourselves: What if AI could understand how each person learns best?
                What if technology could keep you focused and motivated? What if your learning
                path could adapt in real-time to your goals and progress?
              </p>
              <p>
                Today, Apex serves over 50,000 learners worldwide, helping them master new skills,
                advance their careers, and achieve their dreams. We're just getting started.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-24"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                  <value.icon className="w-6 h-6 text-neon-cyan" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-500">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-neon-cyan/20"
                />
                <h3 className="text-lg font-semibold text-white">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
