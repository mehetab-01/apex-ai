"use client";

import { motion } from "framer-motion";
import { Star, Clock, Users, Info, ExternalLink, Play } from "lucide-react";
import { cn, formatPrice, formatDuration, formatNumber, getDifficultyColor } from "@/lib/utils";
import type { Course, RecommendedCourse } from "@/lib/api";

// Platform colors and default fallback images
const platformConfig: Record<string, { color: string; bgColor: string; image: string }> = {
  apex: { 
    color: "text-neon-cyan", 
    bgColor: "bg-neon-cyan/20 border-neon-cyan/30",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop"
  },
  udemy: { 
    color: "text-purple-400", 
    bgColor: "bg-purple-500/20 border-purple-500/30",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=200&fit=crop"
  },
  youtube: { 
    color: "text-red-400", 
    bgColor: "bg-red-500/20 border-red-500/30",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=200&fit=crop"
  },
  coursera: { 
    color: "text-blue-400", 
    bgColor: "bg-blue-500/20 border-blue-500/30",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=200&fit=crop"
  },
  infosys: { 
    color: "text-orange-400", 
    bgColor: "bg-orange-500/20 border-orange-500/30",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop"
  },
  nptel: { 
    color: "text-yellow-400", 
    bgColor: "bg-yellow-500/20 border-yellow-500/30",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop"
  },
  cisco: { 
    color: "text-cyan-400", 
    bgColor: "bg-cyan-500/20 border-cyan-500/30",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop"
  },
  cyfrin: { 
    color: "text-emerald-400", 
    bgColor: "bg-emerald-500/20 border-emerald-500/30",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop"
  },
  freecodecamp: { 
    color: "text-green-400", 
    bgColor: "bg-green-500/20 border-green-500/30",
    image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=200&fit=crop"
  },
  hackerrank: { 
    color: "text-lime-400", 
    bgColor: "bg-lime-500/20 border-lime-500/30",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=200&fit=crop"
  },
  codechef: { 
    color: "text-amber-400", 
    bgColor: "bg-amber-500/20 border-amber-500/30",
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=200&fit=crop"
  },
  leetcode: { 
    color: "text-yellow-500", 
    bgColor: "bg-yellow-500/20 border-yellow-500/30",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=200&fit=crop"
  },
  edx: { 
    color: "text-red-500", 
    bgColor: "bg-red-500/20 border-red-500/30",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop"
  },
  mit: { 
    color: "text-red-600", 
    bgColor: "bg-red-600/20 border-red-600/30",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop"
  },
};

// Category-based fallback images
const categoryImages: Record<string, string> = {
  web_development: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop",
  mobile_development: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop",
  data_science: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop",
  machine_learning: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
  artificial_intelligence: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=200&fit=crop",
  cloud_computing: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=200&fit=crop",
  cybersecurity: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop",
  devops: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=200&fit=crop",
  blockchain: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop",
  game_development: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=200&fit=crop",
  ui_ux_design: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop",
  database: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop",
  programming_languages: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop",
  software_engineering: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400&h=200&fit=crop",
  networking: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop",
};

interface CourseCardProps {
  course: Course | RecommendedCourse;
  showMatchScore?: boolean;
  index?: number;
  onInfoClick?: () => void;
  viewMode?: "grid" | "list";
}

export default function CourseCard({ 
  course, 
  showMatchScore = false, 
  index = 0,
  onInfoClick,
  viewMode = "grid"
}: CourseCardProps) {
  const isRecommended = "match_percentage" in course;
  const matchPercentage = isRecommended ? (course as RecommendedCourse).match_percentage : 0;
  const platform = course.platform || "apex";
  const platformStyle = platformConfig[platform] || platformConfig.apex;
  const isExternal = course.external_url && platform !== "apex";

  // Get image - prioritize thumbnail_url, then cover_image_url, then category image, then platform fallback
  const getImage = () => {
    if (course.thumbnail_url) return course.thumbnail_url;
    if (course.cover_image_url) return course.cover_image_url;
    if (course.category && categoryImages[course.category]) return categoryImages[course.category];
    return platformStyle.image;
  };

  // Get short description (first 150 chars)
  const getShortDescription = () => {
    if (!course.description) return "";
    return course.description.length > 150 
      ? course.description.substring(0, 150) + "..." 
      : course.description;
  };

  const handleGoTo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExternal && course.external_url) {
      window.open(course.external_url, "_blank", "noopener,noreferrer");
    }
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInfoClick) {
      onInfoClick();
    }
  };

  // LIST VIEW LAYOUT
  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        className={cn(
          "group relative glass-card overflow-hidden",
          "transition-all duration-300",
          "hover:border-neon-cyan/50 hover:shadow-neon-cyan",
          "flex flex-row"
        )}
      >
        {/* Left: Image */}
        <div className="relative w-48 min-w-[12rem] h-36 overflow-hidden flex-shrink-0">
          <img
            src={getImage()}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = platformStyle.image;
            }}
          />
          {/* Platform Badge on image */}
          <div className="absolute top-2 left-2 z-10">
            <span className={cn(
              "px-2 py-0.5 text-xs font-medium rounded border backdrop-blur-sm",
              platformStyle.bgColor,
              platformStyle.color
            )}>
              {course.platform_display || platform}
            </span>
          </div>
        </div>

        {/* Middle: Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div className="space-y-2">
            {/* Title & Match Score */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-white line-clamp-1 group-hover:text-neon-cyan transition-colors">
                {course.title}
              </h3>
              {showMatchScore && matchPercentage > 0 && (
                <span className="px-2 py-0.5 bg-neon-green/20 border border-neon-green/30 rounded text-xs flex-shrink-0">
                  <span className="text-neon-green font-bold">{matchPercentage.toFixed(0)}%</span>
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-gray-400 line-clamp-2">
              {getShortDescription()}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">by <span className="text-gray-300">{course.instructor}</span></span>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-white">{Number(course.average_rating || 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(course.duration_hours)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>{formatNumber(course.total_enrollments)}</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 text-xs font-medium rounded border",
                getDifficultyColor(course.difficulty)
              )}>
                {course.difficulty_display || course.difficulty}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Buttons */}
        <div className="flex flex-col gap-2 p-4 border-l border-apex-border justify-center">
          <button
            onClick={handleInfo}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-apex-darker border border-apex-border rounded-lg text-gray-300 hover:border-neon-cyan/50 hover:text-neon-cyan transition-all text-sm whitespace-nowrap"
          >
            <Info className="w-4 h-4" />
            <span>Details</span>
          </button>
          {isExternal ? (
            <button
              onClick={handleGoTo}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/20 transition-all text-sm whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Go to Course</span>
            </button>
          ) : (
            <button
              onClick={handleInfo}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/20 transition-all text-sm whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              <span>Start</span>
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // GRID VIEW LAYOUT (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className={cn(
        "group relative glass-card overflow-hidden",
        "transition-all duration-300",
        "hover:border-neon-cyan/50 hover:shadow-neon-cyan"
      )}
    >
      {/* Platform Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className={cn(
          "px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 backdrop-blur-sm",
          platformStyle.bgColor,
          platformStyle.color
        )}>
          {course.platform_display || platform}
        </span>
      </div>

      {/* Match Score Badge */}
      {showMatchScore && matchPercentage > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="px-2 py-1 bg-neon-green/20 border border-neon-green/30 rounded text-xs backdrop-blur-sm"
          >
            <span className="text-neon-green font-bold">{matchPercentage.toFixed(0)}%</span>
            <span className="ml-1 text-gray-300">Match</span>
          </motion.div>
        </div>
      )}

      {/* Cover Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={getImage()}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = platformStyle.image;
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-apex-darker via-apex-darker/50 to-transparent" />
        
        {/* Category Tag */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-black/70 backdrop-blur-sm rounded-md text-gray-200">
            {course.category_display || course.category.replace(/_/g, ' ')}
          </span>
        </div>

      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-white line-clamp-2 min-h-[48px] group-hover:text-neon-cyan transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <p className="text-sm text-gray-400 truncate">
          by <span className="text-gray-300">{course.instructor}</span>
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-sm">
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

        {/* Difficulty Badge */}
        <div className="flex items-center justify-between">
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded border",
            getDifficultyColor(course.difficulty)
          )}>
            {course.difficulty_display || course.difficulty}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-apex-border">
          {/* Info Button */}
          <button
            onClick={handleInfo}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-apex-darker border border-apex-border rounded-lg text-gray-300 hover:border-neon-cyan/50 hover:text-neon-cyan transition-all text-sm"
          >
            <Info className="w-4 h-4" />
            <span>Details</span>
          </button>

          {/* Go To Button */}
          {isExternal ? (
            <button
              onClick={handleGoTo}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/20 transition-all text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Go to Course</span>
            </button>
          ) : (
            <button
              onClick={handleInfo}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan hover:bg-neon-cyan/20 transition-all text-sm"
            >
              <Play className="w-4 h-4" />
              <span>Start</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
