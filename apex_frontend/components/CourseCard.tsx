"use client";

import { motion } from "framer-motion";
import { Star, Clock, Users, ChevronRight } from "lucide-react";
import { cn, formatPrice, formatDuration, formatNumber, getCategoryColor, getDifficultyColor } from "@/lib/utils";
import type { Course, RecommendedCourse } from "@/lib/api";

interface CourseCardProps {
  course: Course | RecommendedCourse;
  showMatchScore?: boolean;
  index?: number;
  onClick?: () => void;
}

export default function CourseCard({ 
  course, 
  showMatchScore = false, 
  index = 0,
  onClick 
}: CourseCardProps) {
  const isRecommended = "match_percentage" in course;
  const matchPercentage = isRecommended ? (course as RecommendedCourse).match_percentage : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "group relative glass-card overflow-hidden cursor-pointer",
        "transition-all duration-300",
        "hover:border-neon-cyan/50 hover:shadow-neon-cyan"
      )}
    >
      {/* Match Score Badge */}
      {showMatchScore && matchPercentage > 0 && (
        <div className="absolute top-3 right-3 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="match-badge"
          >
            <span className="text-neon-green font-bold">{matchPercentage.toFixed(0)}%</span>
            <span className="ml-1 text-gray-400">Match</span>
          </motion.div>
        </div>
      )}

      {/* Cover Image */}
      <div className="relative h-40 overflow-hidden">
        {course.cover_image_url ? (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-apex-card">
            <div className="absolute inset-0 bg-neon-cyan/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-neon-cyan/30">
                {course.title.charAt(0)}
              </span>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-apex-card/50" />
        
        {/* Category Tag */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-black/60 backdrop-blur-sm rounded-md text-gray-300">
            {course.category_display || course.category.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-white line-clamp-2 group-hover:text-neon-cyan transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-sm text-gray-400">
          by <span className="text-gray-300">{course.instructor}</span>
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-medium">
              {Number(course.average_rating || 0).toFixed(1)}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(course.duration_hours)}</span>
          </div>

          {/* Enrollments */}
          <div className="flex items-center gap-1 text-gray-400">
            <Users className="w-4 h-4" />
            <span>{formatNumber(course.total_enrollments)}</span>
          </div>
        </div>

        {/* Difficulty & Price Row */}
        <div className="flex items-center justify-between pt-2 border-t border-apex-border">
          {/* Difficulty Badge */}
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded border",
            getDifficultyColor(course.difficulty)
          )}>
            {course.difficulty_display || course.difficulty}
          </span>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-bold",
              course.price === 0 ? "text-neon-green" : "text-white"
            )}>
              {formatPrice(course.price)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 bg-neon-cyan/5" />
      </div>
    </motion.div>
  );
}
