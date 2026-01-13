"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Upload, 
  FileText, 
  Sparkles, 
  Target,
  TrendingUp,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Code,
  Database,
  Cloud,
  Brain
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import CourseCard from "@/components/CourseCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { uploadResume, type CareerAnalysis, type RecommendedCourse } from "@/lib/api";
import { cn } from "@/lib/utils";

type Stage = "upload" | "analyzing" | "results";

const categoryIcons: Record<string, React.ElementType> = {
  web_development: Code,
  data_science: Database,
  cloud_computing: Cloud,
  machine_learning: Brain,
  artificial_intelligence: Brain,
  default: BookOpen,
};

export default function CareerPage() {
  const [stage, setStage] = useState<Stage>("upload");
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setStage("analyzing");
    setError(null);
    
    try {
      const result = await uploadResume(file);
      setAnalysis(result.analysis);
      setRecommendedCourses(result.recommended_courses || []);
      setStage("results");
    } catch (err: any) {
      console.error("Resume analysis failed:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to analyze resume. Please make sure the backend server is running.";
      setError(errorMessage);
      setStage("upload");
    }
  };

  const resetAnalysis = () => {
    setStage("upload");
    setAnalysis(null);
    setRecommendedCourses([]);
    setError(null);
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-neon-purple">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Career Roadmap</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Upload your resume and let AI analyze your skills to create a personalized career path and course recommendations.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Upload Stage */}
          {stage === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card p-8">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Upload Your Resume
                  </h2>
                  <p className="text-gray-400 text-sm">
                    We'll analyze your skills and experience to provide personalized recommendations
                  </p>
                </div>

                <FileUpload
                  onUpload={handleUpload}
                  accept=".pdf"
                  maxSize={10}
                  label="Drop your resume here"
                  description="PDF format, up to 10MB"
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* What we analyze */}
                <div className="mt-8 pt-8 border-t border-apex-border">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">What we analyze:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Code, text: "Technical Skills" },
                      { icon: TrendingUp, text: "Experience Level" },
                      { icon: Target, text: "Career Goals" },
                      { icon: BookOpen, text: "Learning Gaps" },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-2 text-gray-300">
                        <item.icon className="w-4 h-4 text-neon-cyan" />
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analyzing Stage */}
          {stage === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="glass-card p-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <Sparkles className="w-16 h-16 text-neon-cyan" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Analyzing Your Resume
                </h2>
                <p className="text-gray-400 mb-6">
                  Our AI is extracting skills and creating your personalized roadmap...
                </p>
                <LoadingSpinner size="md" />
              </div>
            </motion.div>
          )}

          {/* Results Stage */}
          {stage === "results" && analysis && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Success Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border-neon-green/30 bg-neon-green/5"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-neon-green/20">
                    <CheckCircle className="w-8 h-8 text-neon-green" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">Analysis Complete!</h2>
                    <p className="text-gray-400">
                      We've identified your skills and created a personalized learning path.
                    </p>
                  </div>
                  <button
                    onClick={resetAnalysis}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Upload Different Resume
                  </button>
                </div>
              </motion.div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Skills & Categories */}
                <div className="space-y-6">
                  {/* Extracted Skills */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Code className="w-5 h-5 text-neon-cyan" />
                      Extracted Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.extracted_skills.map((skill, index) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan text-sm rounded-full border border-neon-cyan/20"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Experience Level */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-neon-purple" />
                      Experience Level
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white capitalize">
                        {analysis.experience_level}
                      </span>
                      <span className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded">
                        Level
                      </span>
                    </div>
                  </motion.div>

                  {/* Suggested Categories */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-neon-green" />
                      Focus Areas
                    </h3>
                    <div className="space-y-3">
                      {analysis.suggested_categories.map((category, index) => {
                        const Icon = categoryIcons[category] || categoryIcons.default;
                        return (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-apex-darker rounded-lg"
                          >
                            <Icon className="w-5 h-5 text-neon-cyan" />
                            <span className="text-gray-300 capitalize">
                              {category.replace(/_/g, ' ')}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>

                {/* Right Column - Career Paths & Recommendations */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Career Paths */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-neon-pink" />
                      Recommended Career Paths
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {analysis.career_paths.map((path, index) => (
                        <motion.div
                          key={path.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="p-4 bg-apex-darker rounded-lg border border-apex-border hover:border-neon-pink/50 transition-all group cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-white group-hover:text-neon-pink transition-colors">
                              {path.title}
                            </h4>
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-neon-pink group-hover:translate-x-1 transition-all" />
                          </div>
                          <p className="text-sm text-gray-400">
                            {path.description}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Skills to Learn */}
                  {analysis.skills_gap && analysis.skills_gap.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="glass-card p-6"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        Skills to Develop
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.skills_gap.map((skill, index) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 bg-yellow-500/10 text-yellow-400 text-sm rounded-lg border border-yellow-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Recommended Courses */}
                  {recommendedCourses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-neon-cyan" />
                        Recommended Courses for You
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {recommendedCourses.slice(0, 4).map((course, index) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            showMatchScore
                            index={index}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
