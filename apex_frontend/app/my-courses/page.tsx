"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  BarChart3,
  ExternalLink,
  Star,
  Loader2,
  BookMarked,
  Trophy,
  Flame
} from "lucide-react";
import { getUserEnrollments, type Enrollment, type EnrollmentStats } from "@/lib/api";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatDuration } from "@/lib/utils";

type StatusFilter = "all" | "started" | "in_progress" | "completed";

export default function MyCoursesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchEnrollments = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const filter = statusFilter === "all" ? undefined : statusFilter;
        const response = await getUserEnrollments(filter);
        setEnrollments(response.enrollments);
        setStats(response.stats);
      } catch (err) {
        console.error("Failed to fetch enrollments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [isAuthenticated, authLoading, statusFilter, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-neon-green bg-neon-green/10 border-neon-green/30";
      case "in_progress":
        return "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30";
      case "started":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <Flame className="w-4 h-4" />;
      case "started":
        return <Play className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen py-8">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green">
              <BookMarked className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white">My Courses</h1>
          </div>
          <p className="text-gray-400">
            Track your learning progress and continue where you left off
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8"
          >
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/20">
                  <BookOpen className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-sm text-gray-400">Total Courses</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-400/20">
                  <Play className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.started}</p>
                  <p className="text-sm text-gray-400">Started</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/20">
                  <Flame className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.in_progress}</p>
                  <p className="text-sm text-gray-400">In Progress</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-green/20">
                  <Trophy className="w-5 h-5 text-neon-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  <p className="text-sm text-gray-400">Completed</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2"
        >
          {[
            { value: "all", label: "All Courses" },
            { value: "started", label: "Started" },
            { value: "in_progress", label: "In Progress" },
            { value: "completed", label: "Completed" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as StatusFilter)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                statusFilter === filter.value
                  ? "bg-neon-cyan text-black"
                  : "bg-apex-card text-gray-400 hover:text-white border border-apex-border"
              )}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && enrollments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-apex-card flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No courses yet</h3>
            <p className="text-gray-400 mb-6">
              {statusFilter === "all"
                ? "Start learning by enrolling in a course"
                : `No ${statusFilter.replace("_", " ")} courses`}
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-neon-cyan text-black font-semibold rounded-lg hover:shadow-neon-cyan transition-all"
            >
              Browse Courses
            </button>
          </motion.div>
        )}

        {/* Course List */}
        {!loading && enrollments.length > 0 && (
          <div className="space-y-4">
            {enrollments.map((enrollment, index) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-4 hover:border-neon-cyan/30 transition-all cursor-pointer"
                onClick={() => router.push(`/learn/${enrollment.course.id}`)}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-48 h-28 rounded-lg overflow-hidden bg-apex-darker flex-shrink-0">
                    {enrollment.course.thumbnail_url || enrollment.course.cover_image_url ? (
                      <img
                        src={enrollment.course.thumbnail_url || enrollment.course.cover_image_url || ""}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1 line-clamp-1">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          by {enrollment.course.instructor}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
                          getStatusColor(enrollment.status)
                        )}
                      >
                        {getStatusIcon(enrollment.status)}
                        {enrollment.status_display}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white font-medium">
                          {enrollment.progress_percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-apex-darker rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            enrollment.progress_percentage === 100
                              ? "bg-neon-green"
                              : "bg-neon-cyan"
                          )}
                          style={{ width: `${enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDuration(enrollment.course.duration_hours)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        <span>{Number(enrollment.course.average_rating || 0).toFixed(1)}</span>
                      </div>
                      {enrollment.time_spent_minutes > 0 && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>{enrollment.time_spent_minutes} min spent</span>
                        </div>
                      )}
                      {enrollment.course.external_url && (
                        <div className="flex items-center gap-1 text-neon-cyan">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{enrollment.course.platform_display}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
