"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusStatsDisplayProps {
  points: number;
  elapsedSeconds: number;
  attentionScore: number;
  blinkCount?: number;
  eyeTrackingEnabled?: boolean;
  isActive?: boolean;
}

export default function FocusStatsDisplay({
  points,
  elapsedSeconds,
  attentionScore,
  blinkCount = 0,
  eyeTrackingEnabled = false,
  isActive = true,
}: FocusStatsDisplayProps) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const stats = [
    {
      icon: Zap,
      label: "Focus Points",
      value: points.toString(),
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/30",
    },
    {
      icon: Eye,
      label: "Session Time",
      value: timeString,
      color: "text-neon-cyan",
      bgColor: "bg-neon-cyan/10",
      borderColor: "border-neon-cyan/30",
    },
    {
      icon: Target,
      label: "Attention",
      value: `${attentionScore.toFixed(0)}%`,
      color: attentionScore >= 70 ? "text-neon-green" : attentionScore >= 40 ? "text-yellow-400" : "text-red-400",
      bgColor: attentionScore >= 70 ? "bg-neon-green/10" : attentionScore >= 40 ? "bg-yellow-400/10" : "bg-red-400/10",
      borderColor: attentionScore >= 70 ? "border-neon-green/30" : attentionScore >= 40 ? "border-yellow-400/30" : "border-red-400/30",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "glass-card p-3 text-center border overflow-hidden",
              stat.borderColor
            )}
          >
            <div className={cn(
              "inline-flex p-2 rounded-lg mb-2",
              stat.bgColor
            )}>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>

            <motion.div
              key={stat.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn("text-lg sm:text-xl font-bold truncate", stat.color)}
            >
              {stat.value}
            </motion.div>

            <div className="text-xs text-gray-400 mt-1 truncate">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Eye Tracking Status */}
      {eyeTrackingEnabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-3 border border-neon-purple/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-neon-purple/10">
                <Activity className="w-4 h-4 text-neon-purple" />
              </div>
              <span className="text-sm text-gray-300">Eye Tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-neon-green" />
                <span className="text-xs text-gray-400">Active</span>
              </div>
              <div className="h-4 w-px bg-apex-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-neon-cyan">{blinkCount}</span>
                <span className="text-xs text-gray-400">Blinks</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function FocusPointsCounter({ points }: { points: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      </motion.div>
      <span className="font-bold text-yellow-400">
        {points}
      </span>
      <span className="text-yellow-400/70 text-sm">
        Focus Points
      </span>
    </motion.div>
  );
}

export function AttentionIndicator({ score }: { score: number }) {
  const getStatus = () => {
    if (score >= 80) return { text: "Excellent Focus", color: "text-neon-green", glow: "shadow-neon-green" };
    if (score >= 60) return { text: "Good Focus", color: "text-neon-cyan", glow: "shadow-neon-cyan" };
    if (score >= 40) return { text: "Moderate Focus", color: "text-yellow-400", glow: "" };
    return { text: "Low Focus", color: "text-red-400", glow: "" };
  };

  const status = getStatus();

  return (
    <motion.div
      animate={{
        scale: score >= 60 ? [1, 1.02, 1] : 1,
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border",
        status.glow
      )}
    >
      <div className={cn(
        "w-2 h-2 rounded-full animate-pulse",
        score >= 60 ? "bg-neon-green" : score >= 40 ? "bg-yellow-400" : "bg-red-400"
      )} />
      <span className={cn("font-medium", status.color)}>
        {status.text}
      </span>
      <span className={cn("font-bold", status.color)}>
        {score.toFixed(0)}%
      </span>
    </motion.div>
  );
}

export function EyeStatusIndicator({ eyesOpen, eyeTrackingEnabled }: { eyesOpen: boolean; eyeTrackingEnabled: boolean }) {
  if (!eyeTrackingEnabled) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/20 border border-gray-500/30">
        <EyeOff className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400">Eye tracking off</span>
      </div>
    );
  }

  return (
    <motion.div
      animate={eyesOpen ? {} : { opacity: [1, 0.5, 1] }}
      transition={{ duration: 0.5, repeat: eyesOpen ? 0 : Infinity }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border",
        eyesOpen
          ? "bg-neon-green/20 border-neon-green/30"
          : "bg-yellow-500/20 border-yellow-500/30"
      )}
    >
      {eyesOpen ? (
        <>
          <Eye className="w-4 h-4 text-neon-green" />
          <span className="text-xs text-neon-green font-medium">Eyes Open</span>
        </>
      ) : (
        <>
          <EyeOff className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-yellow-400 font-medium">Eyes Closed</span>
        </>
      )}
    </motion.div>
  );
}
