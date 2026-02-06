"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const jobs = [
  {
    title: "Senior Full Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Machine Learning Engineer",
    department: "AI",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Content Strategist",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
  },
  {
    title: "Customer Success Manager",
    department: "Operations",
    location: "Remote",
    type: "Full-time",
  },
];

const benefits = [
  "Competitive salary & equity",
  "Remote-first culture",
  "Unlimited PTO",
  "Health, dental & vision",
  "Learning stipend",
  "Home office setup",
];

export default function CareersPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="text-neon-cyan text-sm font-medium uppercase tracking-wider">Careers</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mt-4 mb-6">
            Join Our Mission
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Help us build the future of education. We're looking for passionate people
            who want to make a real impact on how the world learns.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-white/10 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Why Work at Apex?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                  {benefit}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Job Listings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-8">Open Positions</h2>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <motion.div
                key={job.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="group p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-neon-cyan/30 transition-all cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-neon-cyan transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500">{job.department}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {job.type}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-4">Don't see a role that fits?</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all"
          >
            Send us your resume
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
