"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
}

export default function FileUpload({
  onUpload,
  accept = ".pdf",
  maxSize = 10,
  label = "Upload File",
  description = "Drag and drop or click to browse"
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    const extension = file.name.toLowerCase().split('.').pop();
    const acceptedTypes = accept.split(',').map(t => t.trim().replace('.', ''));
    
    if (!acceptedTypes.includes(extension || '')) {
      return `Invalid file type. Please upload ${accept} files only.`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `File is too large. Maximum size is ${maxSize}MB.`;
    }

    return null;
  };

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setSuccess(false);

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    try {
      await onUpload(selectedFile);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300",
          isDragging
            ? "border-neon-cyan bg-neon-cyan/10"
            : error
            ? "border-red-500/50 bg-red-500/5"
            : success
            ? "border-neon-green/50 bg-neon-green/5"
            : "border-apex-border hover:border-neon-cyan/50 hover:bg-apex-card/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
              </motion.div>
            ) : success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <CheckCircle className="w-12 h-12 text-neon-green" />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <AlertCircle className="w-12 h-12 text-red-400" />
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-4 rounded-full mb-4 transition-colors",
                  isDragging ? "bg-neon-cyan/20" : "bg-apex-card"
                )}
              >
                <Upload className={cn(
                  "w-8 h-8 transition-colors",
                  isDragging ? "text-neon-cyan" : "text-gray-400"
                )} />
              </motion.div>
            )}
          </AnimatePresence>

          <h3 className="font-semibold text-white mb-1">{label}</h3>
          <p className="text-sm text-gray-400">{description}</p>
          <p className="text-xs text-gray-500 mt-2">
            {accept.toUpperCase()} • Max {maxSize}MB
          </p>
        </div>
      </motion.div>

      {/* File Info */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/10">
                  <FileText className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
