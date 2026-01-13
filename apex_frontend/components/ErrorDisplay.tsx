"use client";

import { motion } from "framer-motion";
import { AlertCircle, XCircle, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ 
  title = "Something went wrong", 
  message,
  onRetry 
}: ErrorDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border-red-500/30"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-red-500/10">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{title}</h3>
          <p className="text-gray-400 text-sm">{message}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function EmptyState({ 
  icon: Icon = XCircle,
  title,
  message,
  action
}: {
  icon?: React.ElementType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="inline-flex p-4 rounded-full bg-apex-card mb-4">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mx-auto">{message}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 neon-button-outline text-sm"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
