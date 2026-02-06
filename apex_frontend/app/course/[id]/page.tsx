"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  ExternalLink,
  Globe,
  BookOpen,
  Award,
  CheckCircle,
  ListChecks,
  Play,
  Sparkles,
  RotateCcw
} from "lucide-react";
import { getCourse, getRecommendations, getEnrollmentStatus, type Course, type RecommendedCourse, type Enrollment } from "@/lib/api";
import { PageLoader } from "@/components/LoadingSpinner";
import CourseCard from "@/components/CourseCard";
import StartCourseModal from "@/components/StartCourseModal";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatPrice, formatDuration, formatNumber, getDifficultyColor } from "@/lib/utils";

// Platform colors
const platformConfig: Record<string, { color: string; bgColor: string; name: string }> = {
  apex: { color: "text-neon-cyan", bgColor: "bg-neon-cyan/20", name: "Apex" },
  udemy: { color: "text-purple-400", bgColor: "bg-purple-500/20", name: "Udemy" },
  youtube: { color: "text-red-400", bgColor: "bg-red-500/20", name: "YouTube" },
  coursera: { color: "text-blue-400", bgColor: "bg-blue-500/20", name: "Coursera" },
  infosys: { color: "text-orange-400", bgColor: "bg-orange-500/20", name: "Infosys Springboard" },
  nptel: { color: "text-yellow-400", bgColor: "bg-yellow-500/20", name: "NPTEL" },
  cisco: { color: "text-cyan-400", bgColor: "bg-cyan-500/20", name: "Cisco" },
  cyfrin: { color: "text-emerald-400", bgColor: "bg-emerald-500/20", name: "Cyfrin Updraft" },
  freecodecamp: { color: "text-green-400", bgColor: "bg-green-500/20", name: "freeCodeCamp" },
  hackerrank: { color: "text-lime-400", bgColor: "bg-lime-500/20", name: "HackerRank" },
  codechef: { color: "text-amber-400", bgColor: "bg-amber-500/20", name: "CodeChef" },
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!params.id) return;

      setLoading(true);
      try {
        const courseData = await getCourse(params.id as string);
        setCourse(courseData);

        // Get recommendations
        try {
          const recs = await getRecommendations(params.id as string, 4);
          setRecommendations(recs);
        } catch (recErr) {
          console.error("Failed to fetch recommendations:", recErr);
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.id]);

  // Check enrollment status
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!params.id || !isAuthenticated) return;

      try {
        const status = await getEnrollmentStatus(params.id as string);
        setIsEnrolled(status.is_enrolled);
        setEnrollment(status.enrollment);
      } catch (err) {
        console.error("Failed to check enrollment status:", err);
      }
    };

    checkEnrollment();
  }, [params.id, isAuthenticated]);

  const handleEnrollSuccess = () => {
    setIsEnrolled(true);
    // Refresh enrollment status
    if (params.id && isAuthenticated) {
      getEnrollmentStatus(params.id as string)
        .then(status => {
          setEnrollment(status.enrollment);
        })
        .catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <PageLoader />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-red-400">{error || "Course not found"}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-neon-cyan text-black rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const platform = course.platform || "apex";
  const platformStyle = platformConfig[platform] || platformConfig.apex;
  const isExternal = course.external_url && platform !== "apex";

  const handleEnroll = () => {
    // If already enrolled, go to learn page
    if (isEnrolled) {
      router.push(`/learn/${course.id}`);
      return;
    }

    // Show the start course modal for new enrollments
    setShowStartModal(true);
  };

  return (
    <>
      {/* Start Course Modal */}
      {course && (
        <StartCourseModal
          course={course}
          isOpen={showStartModal}
          onClose={() => setShowStartModal(false)}
          onEnrollSuccess={handleEnrollSuccess}
        />
      )}
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to courses
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              {/* Platform Badge */}
              <div className="flex items-center gap-3 mb-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
                  platformStyle.bgColor,
                  platformStyle.color
                )}>
                  <Globe className="w-4 h-4" />
                  {course.platform_display || platformStyle.name}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium border",
                  getDifficultyColor(course.difficulty)
                )}>
                  {course.difficulty_display || course.difficulty}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {course.title}
              </h1>

              {/* Instructor */}
              <p className="text-gray-400 mb-4">
                Created by <span className="text-neon-cyan">{course.instructor}</span>
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-5 h-5 fill-yellow-400" />
                  <span className="font-bold">{Number(course.average_rating || 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{formatNumber(course.total_enrollments)} students</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(course.duration_hours)}</span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-neon-cyan" />
                About This Course
              </h2>
              <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                {course.description}
              </p>
            </motion.div>

            {/* What You'll Learn */}
            {course.what_you_learn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-neon-green" />
                  What You'll Learn
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.what_you_learn.split(",").map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-neon-green mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{item.trim()}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Syllabus */}
            {course.syllabus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-neon-purple" />
                  Course Syllabus
                </h2>
                <div className="space-y-2">
                  {course.syllabus.split("\n").map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-apex-darker rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
                        <span className="text-neon-purple text-sm font-bold">{idx + 1}</span>
                      </div>
                      <span className="text-gray-300">{item.replace(/^\d+\.\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Prerequisites
                </h2>
                <p className="text-gray-300">{course.prerequisites}</p>
              </motion.div>
            )}

            {/* Tags */}
            {course.tags_list && course.tags_list.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-bold text-white mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {course.tags_list.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-apex-darker text-gray-300 rounded-full text-sm border border-apex-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enroll Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 sticky top-24"
            >
              {/* Price */}
              <div className="text-center mb-6">
                <div className={cn(
                  "text-4xl font-bold",
                  course.price === 0 ? "text-neon-green" : "text-white"
                )}>
                  {formatPrice(course.price)}
                </div>
                {course.price === 0 && (
                  <p className="text-gray-400 text-sm mt-1">Free Course</p>
                )}
              </div>

              {/* Enrollment Status Badge */}
              {isEnrolled && enrollment && (
                <div className="mb-4 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neon-green font-medium">Enrolled</span>
                    <span className="text-gray-400">
                      {enrollment.progress_percentage}% complete
                    </span>
                  </div>
                  {enrollment.progress_percentage > 0 && (
                    <div className="mt-2 h-1.5 bg-apex-darker rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-green rounded-full transition-all"
                        style={{ width: `${enrollment.progress_percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Enroll Button */}
              <button
                onClick={handleEnroll}
                className={cn(
                  "w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
                  isEnrolled
                    ? "bg-neon-green text-black hover:shadow-neon-green"
                    : "bg-neon-cyan text-black hover:shadow-neon-cyan"
                )}
              >
                {isEnrolled ? (
                  isExternal ? (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      Continue on {course.platform_display || platformStyle.name}
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      Continue Learning
                    </>
                  )
                ) : isExternal ? (
                  <>
                    <ExternalLink className="w-5 h-5" />
                    Go to {course.platform_display || platformStyle.name}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Learning
                  </>
                )}
              </button>

              {/* Course Info */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Category</span>
                  <span className="text-white">{course.category_display || course.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white">{formatDuration(course.duration_hours)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Students</span>
                  <span className="text-white">{formatNumber(course.total_enrollments)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Rating</span>
                  <span className="text-white flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {Number(course.average_rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-neon-cyan" />
              Similar Courses You Might Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {recommendations.map((rec, index) => (
                <CourseCard
                  key={rec.id}
                  course={rec}
                  index={index}
                  showMatchScore
                  onInfoClick={() => router.push(`/course/${rec.id}`)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}
