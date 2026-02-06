"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, BookOpen, Clock, Star, Users, ExternalLink, MonitorPlay } from "lucide-react";
import { Course, enrollInCourse } from "@/lib/api";
import { cn, formatDuration, formatNumber, isYouTubeUrl, getEmbedUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface StartCourseModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onEnrollSuccess: () => void;
}

export default function StartCourseModal({
  course,
  isOpen,
  onClose,
  onEnrollSuccess,
}: StartCourseModalProps) {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const isExternal = course.external_url && course.platform !== "apex";
  const videoUrl = course.external_url || course.video_url;
  const canEmbed = videoUrl ? !!getEmbedUrl(videoUrl, course.platform) : false;
  const isYouTube = videoUrl ? isYouTubeUrl(videoUrl) : false;

  const handleStartCourse = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsEnrolling(true);
    setError(null);

    try {
      await enrollInCourse(course.id);
      onEnrollSuccess();
      onClose();

      // Navigate to learn page (works for both embeddable and non-embeddable)
      router.push(`/learn/${course.id}`);
    } catch (err) {
      console.error("Enrollment failed:", err);
      setError("Failed to enroll in course. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 px-4"
          >
            <div className="glass-card p-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className={cn(
                  "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                  canEmbed ? "bg-neon-green/20" : "bg-neon-cyan/20"
                )}>
                  {canEmbed ? (
                    <MonitorPlay className="w-8 h-8 text-neon-green" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-neon-cyan" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Start This Course?
                </h2>
                <p className="text-gray-400 text-sm">
                  {canEmbed
                    ? "Watch this course directly in APEX with progress tracking"
                    : "This course will be added to your learning dashboard"}
                </p>
              </div>

              {/* Course Info */}
              <div className="bg-apex-darker rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-white mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  by {course.instructor}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(course.duration_hours)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{Number(course.average_rating || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{formatNumber(course.total_enrollments)} enrolled</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-lg border border-apex-border text-gray-300 hover:bg-apex-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartCourse}
                  disabled={isEnrolling}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
                    "bg-neon-cyan text-black hover:shadow-neon-cyan",
                    isEnrolling && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isEnrolling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Starting...
                    </>
                  ) : canEmbed ? (
                    <>
                      <MonitorPlay className="w-4 h-4" />
                      Watch in APEX
                    </>
                  ) : isExternal ? (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Start Course
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Course
                    </>
                  )}
                </button>
              </div>

              {/* Login Prompt */}
              {!isAuthenticated && (
                <p className="mt-4 text-center text-sm text-gray-400">
                  You need to{" "}
                  <button
                    onClick={() => router.push("/login")}
                    className="text-neon-cyan hover:underline"
                  >
                    sign in
                  </button>{" "}
                  to track your courses
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
