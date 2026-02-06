"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  ExternalLink,
  BookOpen,
  CheckCircle,
  Play,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Globe,
  AlertCircle,
  List,
  Timer
} from "lucide-react";
import {
  getCourse,
  getEnrollmentStatus,
  enrollInCourse,
  updateEnrollment,
  getYouTubeVideoInfo,
  type Course,
  type Enrollment,
  type YouTubeChapter,
  type PlaylistVideo,
  type YouTubePlaylistInfo
} from "@/lib/api";
import { PageLoader } from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import {
  cn,
  formatDuration,
  formatNumber,
  getDifficultyColor,
  extractYouTubeId,
  isYouTubeUrl,
  getEmbedUrl,
  extractPlaylistId,
  isYouTubePlaylist
} from "@/lib/utils";

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YouTubePlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

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
};

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showChapters, setShowChapters] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [canEmbed, setCanEmbed] = useState(false);

  // YouTube-specific state
  const [chapters, setChapters] = useState<YouTubeChapter[]>([]);
  const [playlist, setPlaylist] = useState<YouTubePlaylistInfo | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);

  // Time tracking
  const startTimeRef = useRef<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  // Track if we're using API or fallback iframe
  // Start with iframe (instant video), upgrade to API only when needed for chapter seeking
  const [useIframeApi, setUseIframeApi] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const apiLoadAttempted = useRef(false);
  const [fallbackStartTime, setFallbackStartTime] = useState(0);

  // Load YouTube IFrame API in background (don't block video playback)
  useEffect(() => {
    if (typeof window === "undefined" || apiLoadAttempted.current) return;
    apiLoadAttempted.current = true;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setApiLoaded(true);
      // DON'T auto-switch to API mode - keep iframe for instant playback
      return;
    }

    // Set up callback before loading script
    const originalCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      setApiLoaded(true);
      // DON'T auto-switch to API mode - only switch when user clicks chapters
      if (originalCallback) originalCallback();
    };

    // Load the API script in background
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Initialize YouTube API player when switching to API mode
  useEffect(() => {
    if (!currentVideoId || typeof window === "undefined") return;
    if (!useIframeApi || !apiLoaded) return; // Only init when using API mode

    // Check if YT API is available
    if (!window.YT || !window.YT.Player) {
      setUseIframeApi(false);
      return;
    }

    // Small delay to ensure DOM is ready after switching modes
    const timeoutId = setTimeout(() => {
      const playerElement = document.getElementById("youtube-player");
      if (!playerElement) return;

      // Destroy existing player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Player might already be destroyed
        }
        playerRef.current = null;
      }

      try {
        // Create new player
        playerRef.current = new window.YT.Player("youtube-player", {
          videoId: currentVideoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            autoplay: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              setPlayerReady(true);
            },
            onError: () => {
              console.warn("YouTube player error, falling back to iframe");
              setUseIframeApi(false);
            },
          },
        });
      } catch (e) {
        console.warn("Failed to create YouTube player, using iframe fallback");
        setUseIframeApi(false);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        playerRef.current = null;
      }
    };
  }, [currentVideoId, apiLoaded, useIframeApi]);

  // Pending seek target (for when we need to switch to API mode first)
  const pendingSeekRef = useRef<number | null>(null);

  // Apply pending seek when player becomes ready
  useEffect(() => {
    if (playerReady && playerRef.current && pendingSeekRef.current !== null) {
      playerRef.current.seekTo(pendingSeekRef.current, true);
      playerRef.current.playVideo();
      pendingSeekRef.current = null;
    }
  }, [playerReady]);

  // Jump to chapter/timestamp
  const jumpToChapter = useCallback((chapter: YouTubeChapter, index: number) => {
    setActiveChapterIndex(index);

    // If using IFrame API and player is ready, use seekTo for smooth seeking
    if (useIframeApi && playerRef.current && playerReady) {
      // Seek to the timestamp - this doesn't reload the video!
      playerRef.current.seekTo(chapter.seconds, true);

      // Resume playing if it was playing
      const state = playerRef.current.getPlayerState();
      if (state !== 1) { // 1 = playing
        playerRef.current.playVideo();
      }
    } else if (apiLoaded && !useIframeApi) {
      // API is loaded but we're still using iframe - switch to API mode for smooth seeking
      pendingSeekRef.current = chapter.seconds;
      setPlayerReady(false);
      setUseIframeApi(true);
    } else {
      // API not loaded, use iframe fallback with start parameter (causes reload)
      setFallbackStartTime(chapter.seconds);
    }
  }, [playerReady, useIframeApi, apiLoaded]);

  // Switch to a different playlist video
  const switchVideo = useCallback(async (video: PlaylistVideo) => {
    // Reset chapter state
    setChapters([]);
    setActiveChapterIndex(0);
    setFallbackStartTime(0);
    pendingSeekRef.current = null;

    // If using API and player is ready, use loadVideoById for smooth transition
    if (useIframeApi && playerRef.current && playerReady) {
      playerRef.current.loadVideoById(video.video_id, 0);
      setCurrentVideoId(video.video_id);
    } else {
      // Otherwise, just update video ID and let iframe handle it
      setCurrentVideoId(video.video_id);
    }

    // Fetch chapters for the new video
    try {
      const info = await getYouTubeVideoInfo(video.video_id);
      if (info.chapters && info.chapters.length > 0) {
        setChapters(info.chapters);
      }
    } catch (err) {
      console.error("Failed to fetch video chapters:", err);
    }
  }, [playerReady, useIframeApi]);

  // Fetch course and enrollment data
  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;

      setLoading(true);
      try {
        const courseData = await getCourse(params.id as string);
        setCourse(courseData);

        // Check if we can embed this video
        const videoUrl = courseData.external_url || courseData.video_url;
        if (videoUrl && isYouTubeUrl(videoUrl)) {
          const videoId = extractYouTubeId(videoUrl);
          const playlistId = extractPlaylistId(videoUrl);

          if (videoId) {
            setCurrentVideoId(videoId);
            setCanEmbed(true);

            // Fetch YouTube video info (chapters and playlist)
            try {
              const ytInfo = await getYouTubeVideoInfo(videoId, playlistId || undefined);

              if (ytInfo.chapters && ytInfo.chapters.length > 0) {
                setChapters(ytInfo.chapters);
              }

              if (ytInfo.playlist && ytInfo.playlist.videos.length > 0) {
                setPlaylist(ytInfo.playlist);
              }
            } catch (err) {
              console.error("Failed to fetch YouTube info:", err);
            }
          }
        } else if (videoUrl) {
          const embed = getEmbedUrl(videoUrl, courseData.platform);
          setCanEmbed(!!embed);
        }

        // Check enrollment status if authenticated
        if (isAuthenticated) {
          try {
            const status = await getEnrollmentStatus(params.id as string);
            if (status.is_enrolled && status.enrollment) {
              setEnrollment(status.enrollment);
            } else {
              // Auto-enroll when viewing
              const enrollResult = await enrollInCourse(params.id as string);
              setEnrollment(enrollResult.enrollment);
            }
          } catch (err) {
            console.error("Enrollment error:", err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [params.id, isAuthenticated, authLoading]);

  // Track time spent
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
      // Save time spent on unmount
      if (enrollment && timeSpent > 60) {
        const newTimeSpent = (enrollment.time_spent_minutes || 0) + Math.floor(timeSpent / 60);
        updateEnrollment(enrollment.id, { time_spent_minutes: newTimeSpent }).catch(console.error);
      }
    };
  }, [enrollment, timeSpent]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || authLoading) {
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
  const syllabusItems = course.syllabus?.split("\n").filter(Boolean) || [];
  const hasChapters = chapters.length > 0;
  const hasPlaylist = playlist && playlist.videos.length > 1;

  // If we can't embed, show alternative view
  if (!canEmbed) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to course
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              External Content
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              This course is hosted on {course.platform_display || platformStyle.name} and cannot be embedded directly.
              Click below to open it in a new tab while staying enrolled in APEX.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={course.external_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neon-cyan text-black font-semibold rounded-lg hover:shadow-neon-cyan transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                Open on {course.platform_display || platformStyle.name}
              </a>
              <button
                onClick={() => router.push(`/course/${course.id}`)}
                className="px-6 py-3 border border-apex-border text-gray-300 rounded-lg hover:bg-apex-card transition-colors"
              >
                View Course Details
              </button>
            </div>

            {/* Course Info */}
            <div className="mt-8 pt-8 border-t border-apex-border">
              <h3 className="font-semibold text-white mb-4">{course.title}</h3>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(course.duration_hours)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{Number(course.average_rating || 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{formatNumber(course.total_enrollments)} enrolled</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apex-darker">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-apex-dark border-b border-apex-border">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Back & Title */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => router.push(`/course/${course.id}`)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-white font-semibold truncate">
                  {course.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className={cn("flex items-center gap-1", platformStyle.color)}>
                    <Globe className="w-3.5 h-3.5" />
                    {course.platform_display || platformStyle.name}
                  </span>
                  <span>•</span>
                  <span>{course.instructor}</span>
                  {hasPlaylist && (
                    <>
                      <span>•</span>
                      <span className="text-neon-cyan">{playlist.videos.length} videos</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Time & Progress */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-white font-mono">{formatTime(timeSpent)}</span>
                <span className="text-gray-500">this session</span>
              </div>

              {enrollment && (
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-apex-darker rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-green rounded-full transition-all"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400">
                    {enrollment.progress_percentage}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Video Player Column */}
          <div className="flex-1 flex flex-col">
            {/* Video Player */}
            <div className="relative w-full h-0 pb-[56.25%] bg-black">
              {currentVideoId && (
                <>
                  {/* Loading indicator - only show when using API and not ready */}
                  {useIframeApi && !playerReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-gray-600 border-t-neon-cyan rounded-full animate-spin" />
                        <span className="text-gray-400 text-sm">Loading video...</span>
                      </div>
                    </div>
                  )}

                  {/* YouTube IFrame API player div */}
                  {useIframeApi && (
                    <div
                      id="youtube-player"
                      className="absolute inset-0 w-full h-full"
                    />
                  )}

                  {/* Fallback iframe when API doesn't load */}
                  {!useIframeApi && (
                    <iframe
                      key={`${currentVideoId}-${fallbackStartTime}`}
                      src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&modestbranding=1&autoplay=1${fallbackStartTime > 0 ? `&start=${fallbackStartTime}` : ''}`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube video player"
                    />
                  )}
                </>
              )}
            </div>

            {/* Playlist Section (below video on mobile and desktop) */}
            {hasPlaylist && (
              <div className="bg-apex-dark border-t border-apex-border lg:hidden">
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <List className="w-5 h-5 text-red-400" />
                    <span className="font-medium">Playlist</span>
                    <span className="text-sm text-gray-500">({playlist.videos.length} videos)</span>
                  </div>
                  {showPlaylist ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showPlaylist && (
                  <div className="max-h-64 overflow-y-auto">
                    {playlist.videos.map((video, idx) => (
                      <button
                        key={video.video_id}
                        onClick={() => switchVideo(video)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left",
                          currentVideoId === video.video_id && "bg-neon-cyan/10 border-l-2 border-neon-cyan"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-24 h-14 object-cover rounded"
                          />
                          {currentVideoId === video.video_id && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                              <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-sm line-clamp-2",
                            currentVideoId === video.video_id ? "text-neon-cyan" : "text-gray-300"
                          )}>
                            {video.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {idx + 1} / {playlist.videos.length}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-96 lg:h-[calc(100vh-73px)] overflow-y-auto border-l border-apex-border bg-apex-dark">
            {/* Chapters Section */}
            {hasChapters && (
              <div className="border-b border-apex-border">
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-neon-green" />
                    <span className="font-medium">Chapters</span>
                    <span className="text-sm text-gray-500">({chapters.length})</span>
                  </div>
                  {showChapters ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showChapters && (
                  <div className="pb-2 max-h-80 overflow-y-auto">
                    {chapters.map((chapter, idx) => (
                      <button
                        key={idx}
                        onClick={() => jumpToChapter(chapter, idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left",
                          activeChapterIndex === idx && "bg-neon-green/10 border-l-2 border-neon-green"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-mono w-12 flex-shrink-0",
                          activeChapterIndex === idx ? "text-neon-green" : "text-gray-500"
                        )}>
                          {chapter.timestamp}
                        </span>
                        <span className={cn(
                          "text-sm line-clamp-2",
                          activeChapterIndex === idx ? "text-neon-green" : "text-gray-300"
                        )}>
                          {chapter.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Playlist Section (in sidebar on desktop) */}
            {hasPlaylist && (
              <div className="hidden lg:block border-b border-apex-border">
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <List className="w-5 h-5 text-red-400" />
                    <span className="font-medium">{playlist.title || "Playlist"}</span>
                    <span className="text-sm text-gray-500">({playlist.videos.length})</span>
                  </div>
                  {showPlaylist ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showPlaylist && (
                  <div className="max-h-72 overflow-y-auto">
                    {playlist.videos.map((video, idx) => (
                      <button
                        key={video.video_id}
                        onClick={() => switchVideo(video)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left",
                          currentVideoId === video.video_id && "bg-neon-cyan/10 border-l-2 border-neon-cyan"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-20 h-12 object-cover rounded"
                          />
                          {currentVideoId === video.video_id && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "text-sm line-clamp-2",
                            currentVideoId === video.video_id ? "text-neon-cyan" : "text-gray-300"
                          )}>
                            {video.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Video {idx + 1}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Course Info */}
            <div className="p-4 border-b border-apex-border">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  platformStyle.bgColor,
                  platformStyle.color
                )}>
                  {course.platform_display || platformStyle.name}
                </span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium border",
                  getDifficultyColor(course.difficulty)
                )}>
                  {course.difficulty_display || course.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>{Number(course.average_rating || 0).toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{formatNumber(course.total_enrollments)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(course.duration_hours)}</span>
                </div>
              </div>
            </div>

            {/* Syllabus (if no chapters available) */}
            {!hasChapters && syllabusItems.length > 0 && (
              <div className="border-b border-apex-border">
                <button
                  onClick={() => setShowSyllabus(!showSyllabus)}
                  className="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-neon-purple" />
                    <span className="font-medium">Course Content</span>
                  </div>
                  {showSyllabus ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {showSyllabus && (
                  <div className="pb-2">
                    {syllabusItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-apex-card flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-gray-400">{idx + 1}</span>
                        </div>
                        <span className="text-sm text-gray-300 line-clamp-2">
                          {item.replace(/^\d+\.\s*/, "")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* About */}
            <div className="p-4">
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-neon-cyan" />
                About this course
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-6">
                {course.description}
              </p>
              <button
                onClick={() => router.push(`/course/${course.id}`)}
                className="mt-3 text-sm text-neon-cyan hover:underline flex items-center gap-1"
              >
                View full details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* What You'll Learn */}
            {course.what_you_learn && (
              <div className="p-4 border-t border-apex-border">
                <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-neon-green" />
                  What you'll learn
                </h3>
                <div className="space-y-2">
                  {course.what_you_learn.split(",").slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400">{item.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Link */}
            {course.external_url && (
              <div className="p-4 border-t border-apex-border">
                <a
                  href={course.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-apex-border rounded-lg text-gray-300 hover:text-white hover:border-neon-cyan/50 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open on {course.platform_display || platformStyle.name}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
