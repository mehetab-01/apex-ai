"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Upload, 
  FileText, 
  Sparkles, 
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Code,
  Database,
  Cloud,
  Brain,
  DollarSign,
  Award,
  AlertTriangle,
  Star,
  Zap,
  GraduationCap,
  ChevronRight,
  ExternalLink,
  BarChart3,
  Building2,
  Flame,
  Lightbulb,
  PieChart
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import CourseCard from "@/components/CourseCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { uploadResume, type CareerAnalysis, type RecommendedCourse, type SkillTrendsAnalysis } from "@/lib/api";
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

const importanceColors = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", badge: "bg-red-500/20" },
  important: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", badge: "bg-yellow-500/20" },
  nice_to_have: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/20" },
};

const demandLevelColors = {
  very_high: { bg: "bg-neon-green", text: "text-neon-green", badge: "bg-neon-green/20 border-neon-green/30" },
  high: { bg: "bg-neon-cyan", text: "text-neon-cyan", badge: "bg-neon-cyan/20 border-neon-cyan/30" },
  medium: { bg: "bg-yellow-400", text: "text-yellow-400", badge: "bg-yellow-400/20 border-yellow-400/30" },
  low: { bg: "bg-gray-400", text: "text-gray-400", badge: "bg-gray-400/20 border-gray-400/30" },
};

const trendIcons = {
  rising: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const trendColors = {
  rising: "text-neon-green",
  stable: "text-yellow-400",
  declining: "text-red-400",
};

export default function CareerPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("upload");
  const [analysis, setAnalysis] = useState<CareerAnalysis | null>(null);
  const [skillTrends, setSkillTrends] = useState<SkillTrendsAnalysis | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load saved analysis from sessionStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem("apex_career_analysis");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.analysis) {
          setAnalysis(parsed.analysis);
          setSkillTrends(parsed.skillTrends || null);
          setRecommendedCourses(parsed.recommendedCourses || []);
          setStage("results");
        }
      } catch (e) {
        console.error("Failed to parse saved career analysis:", e);
        sessionStorage.removeItem("apex_career_analysis");
      }
    }
  }, []);

  // Save analysis to sessionStorage when it changes
  useEffect(() => {
    if (analysis && stage === "results") {
      sessionStorage.setItem("apex_career_analysis", JSON.stringify({
        analysis,
        skillTrends,
        recommendedCourses,
        savedAt: new Date().toISOString()
      }));
    }
  }, [analysis, skillTrends, recommendedCourses, stage]);

  const handleUpload = async (file: File) => {
    setStage("analyzing");
    setError(null);
    
    try {
      const result = await uploadResume(file);
      setAnalysis(result.analysis);
      setSkillTrends(result.skill_trends || null);
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
    setSkillTrends(null);
    setRecommendedCourses([]);
    setError(null);
    // Clear sessionStorage when user resets
    sessionStorage.removeItem("apex_career_analysis");
  };

  // Helper to check if skills_gap is in new format
  const isNewSkillGapFormat = (gap: any): gap is { skill: string; importance: string; reason: string; related_roles: string[] } => {
    return typeof gap === 'object' && 'skill' in gap && 'importance' in gap;
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AI Career Analysis</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Upload your resume and let AI analyze your skills, recommend job roles, identify skill gaps, and suggest courses to advance your career.
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
                      { icon: Briefcase, text: "Job Role Matches" },
                      { icon: AlertTriangle, text: "Skill Gaps" },
                      { icon: BarChart3, text: "Market Trends" },
                      { icon: GraduationCap, text: "Course Recommendations" },
                      { icon: TrendingUp, text: "Salary Insights" },
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
                  AI is extracting skills, matching job roles, and finding courses...
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
                      {analysis.profile_summary || "We've analyzed your profile and created personalized recommendations."}
                    </p>
                  </div>
                  <button
                    onClick={resetAnalysis}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors border border-apex-border rounded-lg hover:border-neon-cyan/50"
                  >
                    Upload Different Resume
                  </button>
                </div>
              </motion.div>

              {/* Top Row: Skills & Strengths */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Extracted Skills */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-neon-cyan" />
                    Your Skills ({analysis.extracted_skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.extracted_skills.map((skill, index) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + index * 0.03 }}
                        className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan text-sm rounded-full border border-neon-cyan/20"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                  
                  {/* Experience Level & Strengths */}
                  <div className="mt-6 pt-4 border-t border-apex-border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400">Experience Level</span>
                      <span className="px-3 py-1 bg-neon-purple/20 text-neon-purple text-sm rounded-full border border-neon-purple/30 capitalize font-semibold">
                        {analysis.experience_level}
                      </span>
                    </div>
                    {analysis.strengths && analysis.strengths.length > 0 && (
                      <div>
                        <span className="text-gray-400 text-sm">Key Strengths:</span>
                        <div className="mt-2 space-y-1">
                          {analysis.strengths.slice(0, 4).map((strength, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                              <Star className="w-3 h-3 text-yellow-400" />
                              {strength}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Focus Areas */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-neon-green" />
                    Recommended Focus Areas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.suggested_categories.map((category, index) => {
                      const Icon = categoryIcons[category] || categoryIcons.default;
                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                          className="flex items-center gap-3 p-3 bg-apex-darker rounded-lg border border-apex-border hover:border-neon-green/50 transition-all cursor-pointer"
                          onClick={() => router.push(`/dashboard?category=${category}`)}
                        >
                          <Icon className="w-5 h-5 text-neon-cyan" />
                          <span className="text-gray-300 capitalize text-sm">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Job Role Recommendations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-neon-pink" />
                  Recommended Job Roles
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {analysis.career_paths.map((path, index) => (
                    <motion.div
                      key={path.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="p-4 bg-apex-darker rounded-xl border border-apex-border hover:border-neon-pink/50 transition-all group"
                    >
                      {/* Match Score */}
                      {path.match_score !== undefined && (
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500">Match Score</span>
                          <div className="flex items-center gap-1">
                            <div className="w-20 h-2 bg-apex-dark rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${path.match_score}%` }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                className={cn(
                                  "h-full rounded-full",
                                  path.match_score >= 70 ? "bg-neon-green" :
                                  path.match_score >= 50 ? "bg-yellow-400" : "bg-orange-400"
                                )}
                              />
                            </div>
                            <span className={cn(
                              "text-sm font-bold",
                              path.match_score >= 70 ? "text-neon-green" :
                              path.match_score >= 50 ? "text-yellow-400" : "text-orange-400"
                            )}>
                              {path.match_score}%
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <h4 className="font-semibold text-white group-hover:text-neon-pink transition-colors mb-2">
                        {path.title}
                      </h4>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {path.description}
                      </p>
                      
                      {/* Salary Range */}
                      {path.salary_range && (
                        <div className="flex items-center gap-2 mb-3 text-sm">
                          <DollarSign className="w-4 h-4 text-neon-green" />
                          <span className="text-neon-green font-medium">{path.salary_range}</span>
                        </div>
                      )}
                      
                      {/* Required Skills */}
                      {path.required_skills && path.required_skills.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-gray-500">Key Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {path.required_skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="px-2 py-0.5 bg-apex-dark text-xs text-gray-400 rounded">
                                {skill}
                              </span>
                            ))}
                            {path.required_skills.length > 3 && (
                              <span className="px-2 py-0.5 text-xs text-gray-500">
                                +{path.required_skills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Growth Potential */}
                      {path.growth_potential && (
                        <div className="pt-3 border-t border-apex-border">
                          <div className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-neon-cyan mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-400">{path.growth_potential}</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Skills Gap Analysis */}
              {analysis.skills_gap && analysis.skills_gap.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-card p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Skills to Develop
                    <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                      {analysis.skills_gap.length} gaps identified
                    </span>
                  </h3>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analysis.skills_gap.map((gap, index) => {
                      // Handle both old (string) and new (object) format
                      if (isNewSkillGapFormat(gap)) {
                        const colors = importanceColors[gap.importance as keyof typeof importanceColors] || importanceColors.important;
                        return (
                          <motion.div
                            key={gap.skill}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            className={cn(
                              "p-4 rounded-lg border",
                              colors.bg,
                              colors.border
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className={cn("font-semibold", colors.text)}>
                                {gap.skill}
                              </h4>
                              <span className={cn(
                                "px-2 py-0.5 text-xs rounded capitalize",
                                colors.badge,
                                colors.text
                              )}>
                                {gap.importance.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mb-3">
                              {gap.reason}
                            </p>
                            {gap.related_roles && gap.related_roles.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {gap.related_roles.map((role) => (
                                  <span key={role} className="px-2 py-0.5 bg-apex-dark text-xs text-gray-500 rounded">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        );
                      } else {
                        // Old format: just a string
                        return (
                          <motion.div
                            key={String(gap)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.05 }}
                            className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30"
                          >
                            <h4 className="font-semibold text-yellow-400">{String(gap)}</h4>
                          </motion.div>
                        );
                      }
                    })}
                  </div>
                </motion.div>
              )}

              {/* Real-Time Skill Market Trends */}
              {skillTrends && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="space-y-6"
                >
                  {/* Section Header */}
                  <div className="glass-card p-6 border-neon-cyan/30 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Real-Time Market Trends</h3>
                        <p className="text-gray-400 text-sm">AI-powered analysis of your skills in today's job market</p>
                      </div>
                    </div>
                    <p className="text-gray-300 bg-apex-darker/50 p-4 rounded-lg border border-apex-border">
                      {skillTrends.market_overview}
                    </p>
                  </div>

                  {/* Skill Demand Analysis */}
                  <div className="glass-card p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-neon-green" />
                      Your Skills Market Demand
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {skillTrends.skill_analysis.map((skill, index) => {
                        const demandColor = demandLevelColors[skill.demand_level] || demandLevelColors.medium;
                        const TrendIcon = trendIcons[skill.trend] || trendIcons.stable;
                        const trendColor = trendColors[skill.trend] || trendColors.stable;
                        
                        return (
                          <motion.div
                            key={skill.skill}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.03 }}
                            className="p-3 bg-apex-darker rounded-lg border border-apex-border hover:border-neon-cyan/30 transition-all"
                          >
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-white text-sm">{skill.skill}</h5>
                                <div className={cn("flex items-center gap-0.5", trendColor)}>
                                  <TrendIcon className="w-3 h-3" />
                                  <span className="text-xs">{skill.growth_rate}</span>
                                </div>
                              </div>
                              <span className={cn(
                                "px-1.5 py-0.5 text-[10px] rounded border capitalize",
                                demandColor.badge,
                                demandColor.text
                              )}>
                                {skill.demand_level.replace(/_/g, ' ')}
                              </span>
                            </div>
                            
                            {/* Demand Bar */}
                            <div className="mb-2">
                              <div className="w-full h-1.5 bg-apex-dark rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${skill.demand_score}%` }}
                                  transition={{ delay: 0.7 + index * 0.03, duration: 0.4 }}
                                  className={cn("h-full rounded-full", demandColor.bg)}
                                />
                              </div>
                            </div>
                            
                            {/* Stats Row - Compact */}
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              <span className="text-neon-green">{skill.avg_salary_impact}</span>
                              <span>•</span>
                              <span>{skill.job_openings} jobs</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hot Skills & Industry Demand Row */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Hot Skills */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="glass-card p-6"
                    >
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-400" />
                        Hot Skills in Your Domain
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {skillTrends.hot_skills.map((skill, index) => (
                          <motion.span
                            key={skill}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.75 + index * 0.03 }}
                            className="px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 text-sm rounded-full border border-orange-500/30 flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            {skill}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>

                    {/* Industry Demand Distribution */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.75 }}
                      className="glass-card p-6"
                    >
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-neon-purple" />
                        Industry Demand for Your Skills
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(skillTrends.industry_demand).map(([industry, percentage], index) => (
                          <motion.div
                            key={industry}
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "100%" }}
                            transition={{ delay: 0.8 + index * 0.05 }}
                          >
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-300 capitalize">{industry}</span>
                              <span className="text-neon-cyan font-medium">{percentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-apex-dark rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: 0.85 + index * 0.05, duration: 0.5 }}
                                className={cn(
                                  "h-full rounded-full",
                                  index === 0 ? "bg-neon-cyan" :
                                  index === 1 ? "bg-neon-green" :
                                  index === 2 ? "bg-neon-purple" :
                                  index === 3 ? "bg-neon-pink" : "bg-gray-400"
                                )}
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Emerging Skill Combinations */}
                  {skillTrends.emerging_combinations && skillTrends.emerging_combinations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="glass-card p-6"
                    >
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-neon-pink" />
                        Emerging Skill Combinations
                        <span className="text-xs text-gray-500 font-normal ml-2">Skills that work great together</span>
                      </h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skillTrends.emerging_combinations.map((combo, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.85 + index * 0.05 }}
                            className="p-4 bg-apex-darker rounded-lg border border-apex-border hover:border-neon-pink/30 transition-all"
                          >
                            <div className="flex flex-wrap gap-1 mb-2">
                              {combo.skills.map((skill, i) => (
                                <span key={skill} className="flex items-center">
                                  <span className="px-2 py-0.5 bg-neon-pink/10 text-neon-pink text-xs rounded border border-neon-pink/20">
                                    {skill}
                                  </span>
                                  {i < combo.skills.length - 1 && (
                                    <span className="text-gray-500 mx-1">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                            <p className="text-sm text-gray-400">{combo.value}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Market Insights & Recommendations */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Market Insights */}
                    {skillTrends.market_insights && skillTrends.market_insights.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.85 }}
                        className="glass-card p-6"
                      >
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-400" />
                          Market Insights
                        </h4>
                        <div className="space-y-3">
                          {skillTrends.market_insights.map((insight, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.9 + index * 0.03 }}
                              className="flex items-start gap-3 p-3 bg-apex-darker rounded-lg"
                            >
                              <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-yellow-400 text-xs font-bold">{index + 1}</span>
                              </div>
                              <p className="text-sm text-gray-300">{insight}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* AI Recommendations */}
                    {skillTrends.recommendations && skillTrends.recommendations.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="glass-card p-6 border-neon-green/20"
                      >
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-neon-green" />
                          AI Career Recommendations
                        </h4>
                        <div className="space-y-3">
                          {skillTrends.recommendations.map((rec, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.95 + index * 0.03 }}
                              className="flex items-start gap-3 p-3 bg-neon-green/5 rounded-lg border border-neon-green/10"
                            >
                              <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-gray-300">{rec}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
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
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-neon-cyan" />
                      Recommended Courses to Fill Your Skill Gaps
                    </h3>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="text-sm text-neon-cyan hover:underline flex items-center gap-1"
                    >
                      View all courses
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedCourses.slice(0, 6).map((course, index) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        showMatchScore
                        index={index}
                        onInfoClick={() => router.push(`/course/${course.id}`)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
