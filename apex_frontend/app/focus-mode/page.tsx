"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  Play, 
  Pause, 
  StopCircle, 
  Camera,
  CameraOff,
  Zap,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import FocusStatsDisplay, { FocusPointsCounter, AttentionIndicator } from "@/components/FocusStats";
import { saveFocusSession, type FocusStats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type SessionState = "idle" | "active" | "paused" | "ended";

export default function FocusModePage() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [stats, setStats] = useState<FocusStats>({
    frame_count: 0,
    face_detected_count: 0,
    attention_score: 0,
    accumulated_points: 0,
    elapsed_seconds: 0,
    elapsed_minutes: 0,
  });
  const [showVideo, setShowVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [localTimer, setLocalTimer] = useState(0);
  const [localPoints, setLocalPoints] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start browser webcam via getUserMedia
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setVideoError(false);
      setShowVideo(true);
    } catch (err) {
      console.warn("Could not access camera:", err);
      setVideoError(true);
      setShowVideo(false);
    }
  }, []);

  // Stop browser webcam
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  // Attach stream to video element when ref or stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, showVideo]);

  // Timer effect when session is active
  useEffect(() => {
    if (sessionState === "active") {
      timerIntervalRef.current = setInterval(() => {
        setLocalTimer(prev => prev + 1);
        setLocalPoints(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [sessionState]);

  const startSession = async () => {
    setSessionState("active");
    setVideoError(false);
    setLocalTimer(0);
    setLocalPoints(0);
    await startCamera();
  };

  const pauseSession = () => {
    setSessionState("paused");
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const resumeSession = () => {
    setSessionState("active");
  };

  const endSession = async () => {
    setSessionState("ended");
    setShowVideo(false);
    stopCamera();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    // Save session to user profile if authenticated
    if (isAuthenticated && localPoints > 0) {
      setIsSaving(true);
      try {
        const result = await saveFocusSession({
          points: localPoints,
          duration_seconds: localTimer,
          attention_score: stats.attention_score || 75,
        });

        // Update local user state with new totals
        if (result.status === "success" && result.user_stats) {
          updateUser({
            focus_points: result.user_stats.total_focus_points,
            total_focus_time_minutes: result.user_stats.total_focus_time_minutes,
          } as any);
        }
      } catch (error) {
        console.error("Failed to save focus session:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const resetSession = () => {
    setSessionState("idle");
    setStats({
      frame_count: 0,
      face_detected_count: 0,
      attention_score: 0,
      accumulated_points: 0,
      elapsed_seconds: 0,
      elapsed_minutes: 0,
    });
    setLocalTimer(0);
    setLocalPoints(0);
    setVideoError(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="py-8 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <motion.div
              animate={sessionState === "active" ? { 
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 0 0 rgba(0, 255, 136, 0)",
                  "0 0 20px 10px rgba(0, 255, 136, 0.3)",
                  "0 0 0 0 rgba(0, 255, 136, 0)"
                ]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-3 rounded-xl bg-neon-green"
            >
              <Eye className="w-8 h-8 text-black" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Focus Mode</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Track your attention in real-time using AI-powered face detection. 
            Earn focus points while you study!
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Video Feed Section */}
          <div className="lg:col-span-2 order-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "relative aspect-video rounded-2xl overflow-hidden",
                "border-2 transition-all duration-500",
                sessionState === "active" 
                  ? "border-neon-green/50 shadow-neon-green" 
                  : "border-apex-border"
              )}
            >
              {/* Video Feed */}
              {showVideo && !videoError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="absolute inset-0 bg-apex-card flex flex-col items-center justify-center">
                  {videoError ? (
                    <>
                      <CameraOff className="w-16 h-16 text-red-400 mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Camera Not Available</h3>
                      <p className="text-gray-400 text-center max-w-sm mb-4">
                        Please allow camera access in your browser to use face tracking.
                        You can still earn focus points without the camera!
                      </p>
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/30 transition-all text-sm font-medium"
                      >
                        Retry Camera
                      </button>
                    </>
                  ) : sessionState === "ended" ? (
                    <>
                      <CheckCircle className="w-16 h-16 text-neon-green mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Session Complete!</h3>
                      <p className="text-gray-400">Great job staying focused for {formatTime(localTimer)}!</p>
                      {isAuthenticated && (
                        <div className="mt-4 text-center space-y-1">
                          {isSaving ? (
                            <p className="text-neon-cyan text-sm">Saving your progress...</p>
                          ) : (
                            <>
                              <p className="text-neon-green text-sm">
                                +{localPoints} points saved to your profile!
                              </p>
                              <p className="text-neon-cyan text-sm">
                                +{Math.floor(localTimer / 60)} min focus time recorded
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Camera className="w-16 h-16 text-gray-500 mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Ready to Focus?</h3>
                      <p className="text-gray-400 text-center max-w-sm">
                        Click the Start button to begin your focus session with real-time attention tracking.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Live Indicator */}
              {sessionState === "active" && !videoError && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                  <motion.div
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-red-500 rounded-full"
                  />
                  <span className="text-sm font-medium text-white">LIVE</span>
                </div>
              )}

              {/* Floating Stats */}
              {sessionState === "active" && (
                <div className="absolute top-4 right-4">
                  <AttentionIndicator score={stats.attention_score || (localTimer > 0 ? 75 : 0)} />
                </div>
              )}

              {/* Timer Overlay */}
              {sessionState !== "idle" && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
                    <Clock className="w-4 h-4 text-neon-cyan" />
                    <span className="text-xl font-mono font-bold text-white">
                      {formatTime(localTimer)}
                    </span>
                  </div>
                  <FocusPointsCounter points={localPoints} />
                </div>
              )}
            </motion.div>

            {/* Control Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 mt-6"
            >
              {sessionState === "idle" && (
                <button
                  onClick={startSession}
                  className="flex items-center gap-2 px-8 py-4 bg-neon-green text-black font-bold rounded-xl hover:shadow-neon-green transition-all duration-300 hover:scale-105"
                >
                  <Play className="w-6 h-6" />
                  Start Focus Session
                </button>
              )}

              {sessionState === "active" && (
                <>
                  <button
                    onClick={pauseSession}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold rounded-xl hover:bg-yellow-500/30 transition-all"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                  <button
                    onClick={endSession}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-xl hover:bg-red-500/30 transition-all"
                  >
                    <StopCircle className="w-5 h-5" />
                    End Session
                  </button>
                </>
              )}

              {sessionState === "paused" && (
                <>
                  <button
                    onClick={resumeSession}
                    className="flex items-center gap-2 px-6 py-3 bg-neon-green/20 text-neon-green border border-neon-green/30 font-semibold rounded-xl hover:bg-neon-green/30 transition-all"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                  <button
                    onClick={endSession}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-xl hover:bg-red-500/30 transition-all"
                  >
                    <StopCircle className="w-5 h-5" />
                    End Session
                  </button>
                </>
              )}

              {sessionState === "ended" && (
                <button
                  onClick={resetSession}
                  className="flex items-center gap-2 px-8 py-4 bg-neon-cyan text-black font-bold rounded-xl hover:shadow-neon-cyan transition-all duration-300 hover:scale-105"
                >
                  <Play className="w-6 h-6" />
                  Start New Session
                </button>
              )}
            </motion.div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6 order-2">
            {/* Session Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-neon-cyan" />
                Session Stats
              </h3>
              
              <FocusStatsDisplay
                points={localPoints}
                elapsedSeconds={localTimer}
                attentionScore={stats.attention_score || (sessionState === "active" ? 75 : 0)}
                blinkCount={stats.blink_count || 0}
                eyeTrackingEnabled={stats.eye_tracking_enabled || false}
                isActive={sessionState === "active"}
              />
            </motion.div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-neon-purple" />
                How It Works
              </h3>
              
              <div className="space-y-4">
                {[
                  {
                    icon: Camera,
                    title: "Face Detection",
                    description: "Your browser accesses your webcam for real-time face tracking"
                  },
                  {
                    icon: Eye,
                    title: "Attention Tracking",
                    description: "Your focus is measured by consistent face presence"
                  },
                  {
                    icon: Zap,
                    title: "Earn Points",
                    description: "Accumulate focus points while staying attentive"
                  }
                ].map((item, index) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-apex-darker">
                      <item.icon className="w-4 h-4 text-neon-cyan" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 border-yellow-500/20"
            >
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Tips for Best Results
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Ensure good lighting on your face</li>
                <li>• Sit centered in front of the camera</li>
                <li>• Minimize background movement</li>
                <li>• Keep your face visible and avoid covering it</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
