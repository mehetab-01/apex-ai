"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  CheckCircle2,
  X,
  AlertCircle,
  User,
  Shield,
  RefreshCw,
  Eye,
  Zap,
  ArrowRight,
  ChevronLeft,
  Scan,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface ValidationResult {
  is_valid: boolean;
  status: "valid" | "no_face" | "multiple_faces";
  message: string;
  face_count: number;
}

interface FaceValidationResponse {
  status: string;
  validation: ValidationResult;
  preview_image: string;
  cropped_face: string | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const [step, setStep] = useState<"welcome" | "face" | "complete">("welcome");
  
  // Face detection states
  const [validationResult, setValidationResult] = useState<FaceValidationResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Real-time detection states
  const [detectionStatus, setDetectionStatus] = useState<"scanning" | "detected" | "capturing" | "done" | "none">("none");
  const [faceDetected, setFaceDetected] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect based on auth status
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.onboarding_completed && user?.face_validated) {
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user", 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        }
      });
      setCameraStream(stream);
      setCameraActive(true);
      setDetectionStatus("scanning");
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found. Please connect a webcam.");
      } else if (err.name === "NotReadableError") {
        setError("Camera is in use by another application.");
      } else {
        setError("Could not access camera. Please try again.");
      }
    }
  }, []);

  // Set video source when stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [cameraStream]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setDetectionStatus("none");
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, [cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [cameraStream]);

  // Capture frame from video
  const captureFrame = useCallback((): Blob | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    // Draw mirrored
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    
    // Convert to blob synchronously via data URL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return dataURLtoBlob(dataUrl);
  }, []);

  // Helper to convert data URL to Blob
  const dataURLtoBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Real-time face detection - auto capture when face detected
  const detectFace = useCallback(async () => {
    if (!cameraActive || detectionStatus === "capturing" || detectionStatus === "done" || detectionStatus === "detected") return;
    
    const blob = captureFrame();
    if (!blob) return;
    
    try {
      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");
      
      const response = await fetch("http://localhost:8000/api/auth/validate-face/", {
        method: "POST",
        body: formData,
      });
      
      const data: FaceValidationResponse = await response.json();
      
      if (data.status === "success" && data.validation.is_valid) {
        // Face detected! Start countdown
        setFaceDetected(true);
        setDetectionStatus("detected");
        
        // Clear detection interval
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
          detectionIntervalRef.current = null;
        }
        
        // Start 3 second countdown
        setCountdown(3);
        let count = 3;
        
        countdownIntervalRef.current = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdown(count);
          } else {
            // Clear countdown interval
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            setCountdown(null);
            setDetectionStatus("capturing");
            
            // Capture final image
            finalCapture();
          }
        }, 1000);
      } else {
        setFaceDetected(false);
      }
    } catch (err) {
      console.error("Detection error:", err);
    }
  }, [cameraActive, detectionStatus, captureFrame]);

  // Final capture after countdown
  const finalCapture = useCallback(async () => {
    const blob = captureFrame();
    if (!blob) {
      setError("Failed to capture image. Please try again.");
      setDetectionStatus("scanning");
      setFaceDetected(false);
      // Restart detection
      detectionIntervalRef.current = setInterval(detectFace, 500);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");
      
      const response = await fetch("http://localhost:8000/api/auth/validate-face/", {
        method: "POST",
        body: formData,
      });
      
      const data: FaceValidationResponse = await response.json();
      
      if (data.status === "success" && data.validation.is_valid) {
        setDetectionStatus("done");
        setValidationResult(data);
        setCapturedImage(data.preview_image);
        stopCamera();
      } else {
        setError("Face moved. Please try again and hold still.");
        setDetectionStatus("scanning");
        setFaceDetected(false);
        // Restart detection
        detectionIntervalRef.current = setInterval(detectFace, 500);
      }
    } catch (err) {
      setError("Failed to capture. Please try again.");
      setDetectionStatus("scanning");
      setFaceDetected(false);
      // Restart detection
      detectionIntervalRef.current = setInterval(detectFace, 500);
    }
  }, [captureFrame, stopCamera]);

  // Start detection loop when camera is active
  useEffect(() => {
    if (cameraActive && detectionStatus === "scanning") {
      // Run detection every 500ms
      detectionIntervalRef.current = setInterval(detectFace, 500);
    } else if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [cameraActive, detectionStatus, detectFace]);

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!validationResult?.cropped_face) return;
    
    setIsSaving(true);
    setError(null);
    
    const token = localStorage.getItem("apex_access_token");
    
    try {
      const response = await fetch("http://localhost:8000/api/auth/complete-onboarding/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          cropped_face: validationResult.cropped_face,
          full_name: user?.full_name,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        setError(data.message);
      } else {
        updateUser(data.user);
        setStep("complete");
      }
    } catch (err) {
      setError("Failed to save profile picture.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset everything
  const resetForm = () => {
    setCapturedImage(null);
    setValidationResult(null);
    setError(null);
    setFaceDetected(false);
    setDetectionStatus("none");
    setCountdown(null);
    stopCamera();
  };

  // Retry detection
  const retryDetection = () => {
    setCapturedImage(null);
    setValidationResult(null);
    setError(null);
    setFaceDetected(false);
    setCountdown(null);
    startCamera();
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {["welcome", "face", "complete"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                step === s || ["welcome", "face", "complete"].indexOf(step) > i
                  ? "bg-neon-cyan text-black"
                  : "bg-apex-card text-gray-500 border border-apex-border"
              )}>
                {i + 1}
              </div>
              {i < 2 && (
                <div className={cn(
                  "w-16 h-1 mx-2 rounded transition-colors",
                  ["welcome", "face", "complete"].indexOf(step) > i
                    ? "bg-neon-cyan"
                    : "bg-apex-border"
                )} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Welcome Step */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                <Zap className="w-10 h-10 text-neon-cyan" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Welcome to Apex, {user?.full_name?.split(" ")[0] || "Learner"}!
              </h1>
              
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Let's set up your profile. We use AI-powered face verification 
                to ensure our community stays authentic and bot-free.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-apex-card border border-apex-border">
                  <Shield className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Secure Verification</p>
                </div>
                <div className="p-4 rounded-lg bg-apex-card border border-apex-border">
                  <User className="w-8 h-8 text-neon-green mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Real Humans Only</p>
                </div>
                <div className="p-4 rounded-lg bg-apex-card border border-apex-border">
                  <Eye className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Auto Detection</p>
                </div>
              </div>

              <button
                onClick={() => setStep("face")}
                className="neon-button px-8 flex items-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Face Validation Step */}
          {step === "face" && (
            <motion.div
              key="face"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-6"
            >
              <button
                onClick={() => {
                  stopCamera();
                  setStep("welcome");
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                Face Verification
              </h2>
              <p className="text-gray-400 text-center mb-6">
                Position your face in the frame. We'll automatically capture when detected.
              </p>

              <div className="max-w-md mx-auto">
                {/* Camera not started */}
                {!cameraActive && !validationResult && (
                  <div className="text-center">
                    <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-apex-border flex flex-col items-center justify-center gap-4 mb-6 bg-apex-card/50">
                      <div className="w-24 h-24 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-neon-cyan" />
                      </div>
                      <div>
                        <p className="text-white font-medium mb-1">Ready to scan</p>
                        <p className="text-sm text-gray-500">Click below to start face detection</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={startCamera}
                      className="neon-button px-8 flex items-center gap-2 mx-auto"
                    >
                      <Camera className="w-5 h-5" />
                      Start Camera
                    </button>
                  </div>
                )}

                {/* Camera active - scanning */}
                {cameraActive && !validationResult && (
                  <div className="relative">
                    {/* Video feed */}
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full aspect-square object-cover transform -scale-x-100"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Face guide overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Oval guide */}
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                          <defs>
                            <mask id="faceMask">
                              <rect width="100" height="100" fill="white" />
                              <ellipse cx="50" cy="45" rx="25" ry="32" fill="black" />
                            </mask>
                          </defs>
                          <rect width="100" height="100" fill="rgba(0,0,0,0.5)" mask="url(#faceMask)" />
                          <ellipse 
                            cx="50" 
                            cy="45" 
                            rx="25" 
                            ry="32" 
                            fill="none" 
                            stroke={faceDetected ? "#00FF88" : "#00F0FF"} 
                            strokeWidth="0.5"
                            className={faceDetected ? "animate-pulse" : ""}
                          />
                        </svg>
                      </div>

                      {/* Status indicator */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2">
                        <div className={cn(
                          "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium backdrop-blur-sm",
                          detectionStatus === "detected"
                            ? "bg-neon-green/20 text-neon-green border border-neon-green/30" 
                            : "bg-apex-card/80 text-gray-300 border border-white/10"
                        )}>
                          {detectionStatus === "scanning" && (
                            <>
                              <Scan className="w-4 h-4 animate-pulse" />
                              Scanning for face...
                            </>
                          )}
                          {detectionStatus === "detected" && countdown && (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Face detected! Hold still... {countdown}
                            </>
                          )}
                          {detectionStatus === "capturing" && (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Capturing...
                            </>
                          )}
                        </div>
                      </div>

                      {/* Countdown overlay */}
                      {countdown && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={countdown}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <span className="text-8xl font-bold text-neon-cyan drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">
                            {countdown}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-400">
                        Position your face within the oval guide
                      </p>
                      <button
                        onClick={stopCamera}
                        className="mt-4 px-4 py-2 text-sm text-red-400 hover:text-red-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation result */}
                {validationResult && (
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <img
                        src={validationResult.preview_image}
                        alt="Captured"
                        className="w-64 h-64 rounded-2xl object-cover mx-auto"
                      />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Face Verified
                      </div>
                    </div>

                    <p className="text-gray-400 mb-6">
                      Great! Your face has been verified successfully.
                    </p>

                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={retryDetection}
                        className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5"
                      >
                        Retake
                      </button>
                      <button
                        onClick={completeOnboarding}
                        disabled={isSaving}
                        className="neon-button px-6 flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-neon-green/10 flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-neon-green" />
              </motion.div>

              <h1 className="text-3xl font-bold text-white mb-4">
                You're All Set!
              </h1>
              
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Your profile has been verified. Welcome to the Apex learning community!
              </p>

              <button
                onClick={() => router.push("/dashboard")}
                className="neon-button px-8 flex items-center gap-2 mx-auto"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
