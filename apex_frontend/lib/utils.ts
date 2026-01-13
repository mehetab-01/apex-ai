import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price for display
 */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || price === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Format duration in hours to readable string
 */
export function formatDuration(hours: number | undefined | null): string {
  if (hours === undefined || hours === null) return "N/A";
  if (hours < 1) return "< 1 hour";
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
}

/**
 * Format number with K/M suffixes
 */
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Get category color for styling
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    web_development: "from-blue-500 to-cyan-500",
    mobile_development: "from-green-500 to-emerald-500",
    data_science: "from-purple-500 to-pink-500",
    machine_learning: "from-orange-500 to-red-500",
    artificial_intelligence: "from-pink-500 to-rose-500",
    cloud_computing: "from-sky-500 to-blue-500",
    cybersecurity: "from-red-500 to-orange-500",
    devops: "from-indigo-500 to-purple-500",
    blockchain: "from-yellow-500 to-orange-500",
    game_development: "from-emerald-500 to-teal-500",
    ui_ux_design: "from-pink-500 to-purple-500",
    database: "from-cyan-500 to-blue-500",
    programming_languages: "from-violet-500 to-purple-500",
    software_engineering: "from-slate-500 to-gray-500",
    networking: "from-teal-500 to-cyan-500",
  };
  return colors[category] || "from-gray-500 to-slate-500";
}

/**
 * Get difficulty badge color
 */
export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    beginner: "bg-green-500/20 text-green-400 border-green-500/30",
    intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    advanced: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    expert: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return colors[difficulty] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

/**
 * Generate star rating array
 */
export function getStarRating(rating: number): ("full" | "half" | "empty")[] {
  const stars: ("full" | "half" | "empty")[] = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push("full");
    } else if (i === fullStars && hasHalf) {
      stars.push("half");
    } else {
      stars.push("empty");
    }
  }
  
  return stars;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Calculate time ago string
 */
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  
  for (const [secondsInInterval, name] of intervals) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return `${interval} ${name}${interval > 1 ? "s" : ""} ago`;
    }
  }
  
  return "just now";
}
