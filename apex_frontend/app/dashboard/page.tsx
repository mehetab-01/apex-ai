"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  ChevronDown,
  Sparkles,
  TrendingUp,
  BookOpen,
  RefreshCw
} from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { PageLoader } from "@/components/LoadingSpinner";
import ErrorDisplay, { EmptyState } from "@/components/ErrorDisplay";
import { getCourses, getCategories, type Course } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [sortBy, setSortBy] = useState("-created_at");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filter dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const difficulties = [
    { value: "", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" },
  ];

  const sortOptions = [
    { value: "-created_at", label: "Newest First" },
    { value: "created_at", label: "Oldest First" },
    { value: "-average_rating", label: "Highest Rated" },
    { value: "price", label: "Price: Low to High" },
    { value: "-price", label: "Price: High to Low" },
    { value: "title", label: "Title: A-Z" },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [coursesData, categoriesData] = await Promise.all([
        getCourses({
          category: selectedCategory || undefined,
          difficulty: selectedDifficulty || undefined,
          search: searchQuery || undefined,
          ordering: sortBy,
        }),
        getCategories(),
      ]);
      
      setCourses(coursesData);
      setCategories([{ value: "", label: "All Categories" }, ...categoriesData]);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load courses. Please check if the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedDifficulty, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchData();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedDifficulty("");
    setSortBy("-created_at");
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedDifficulty || sortBy !== "-created_at";

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen pt-24">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-cyan">
              <BookOpen className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white">Course Dashboard</h1>
          </div>
          <p className="text-gray-400">
            Discover AI-powered courses tailored to your learning goals
          </p>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    setShowDifficultyDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-apex-darker border border-apex-border rounded-lg text-gray-300 hover:border-neon-cyan/50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>{categories.find(c => c.value === selectedCategory)?.label || "Category"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showCategoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 mt-2 w-56 bg-apex-card border border-apex-border rounded-lg shadow-xl overflow-hidden"
                  >
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => {
                          setSelectedCategory(category.value);
                          setShowCategoryDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm transition-colors",
                          selectedCategory === category.value
                            ? "bg-neon-cyan/10 text-neon-cyan"
                            : "text-gray-300 hover:bg-white/5"
                        )}
                      >
                        {category.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Difficulty Filter */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowDifficultyDropdown(!showDifficultyDropdown);
                    setShowCategoryDropdown(false);
                    setShowSortDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-apex-darker border border-apex-border rounded-lg text-gray-300 hover:border-neon-cyan/50 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{difficulties.find(d => d.value === selectedDifficulty)?.label || "Level"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showDifficultyDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 mt-2 w-44 bg-apex-card border border-apex-border rounded-lg shadow-xl overflow-hidden"
                  >
                    {difficulties.map((diff) => (
                      <button
                        key={diff.value}
                        onClick={() => {
                          setSelectedDifficulty(diff.value);
                          setShowDifficultyDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm transition-colors",
                          selectedDifficulty === diff.value
                            ? "bg-neon-cyan/10 text-neon-cyan"
                            : "text-gray-300 hover:bg-white/5"
                        )}
                      >
                        {diff.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Sort */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSortDropdown(!showSortDropdown);
                    setShowCategoryDropdown(false);
                    setShowDifficultyDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-apex-darker border border-apex-border rounded-lg text-gray-300 hover:border-neon-cyan/50 transition-colors"
                >
                  <span>{sortOptions.find(s => s.value === sortBy)?.label || "Sort"}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showSortDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 z-50 mt-2 w-48 bg-apex-card border border-apex-border rounded-lg shadow-xl overflow-hidden"
                  >
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm transition-colors",
                          sortBy === option.value
                            ? "bg-neon-cyan/10 text-neon-cyan"
                            : "text-gray-300 hover:bg-white/5"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-apex-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2.5 transition-colors",
                    viewMode === "grid" ? "bg-neon-cyan/10 text-neon-cyan" : "text-gray-400 hover:text-white"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2.5 transition-colors",
                    viewMode === "list" ? "bg-neon-cyan/10 text-neon-cyan" : "text-gray-400 hover:text-white"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-apex-border">
              <span className="text-sm text-gray-400">Active filters:</span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm text-neon-cyan bg-neon-cyan/10 rounded-full hover:bg-neon-cyan/20 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}
        </motion.div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-medium">{courses.length}</span> courses
          </p>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-neon-cyan">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Updating...
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <ErrorDisplay 
            message={error} 
            onRetry={fetchData}
          />
        )}

        {/* Empty State */}
        {!error && !loading && courses.length === 0 && (
          <EmptyState
            icon={BookOpen}
            title="No courses found"
            message="Try adjusting your filters or search query to find what you're looking for."
            action={{
              label: "Clear Filters",
              onClick: clearFilters
            }}
          />
        )}

        {/* Course Grid */}
        {!error && courses.length > 0 && (
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          )}>
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Load More (placeholder) */}
        {courses.length >= 12 && (
          <div className="text-center mt-12">
            <button className="neon-button-outline">
              Load More Courses
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showCategoryDropdown || showDifficultyDropdown || showSortDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowCategoryDropdown(false);
            setShowDifficultyDropdown(false);
            setShowSortDropdown(false);
          }}
        />
      )}
    </div>
  );
}
