"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Upload,
  Check,
  X,
  AlertCircle,
  User,
  Shield,
  Sparkles,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationResult {
  is_valid: boolean;
  status: "valid" | "no_face" | "multiple_faces";
  message: string;
  face_count: number;
}

interface QualityMetrics {
  brightness?: "good" | "poor";
  sharpness?: "good" | "blurry";
  size?: "good" | "adjust";
}

interface FaceValidationResponse {
  status: string;
  validation: ValidationResult;
  quality: QualityMetrics;
  preview_image: string;
  cropped_face: string | null;
}

export default function ProfilePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<FaceValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedProfilePic, setSavedProfilePic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setValidationResult(null);
      setError(null);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      setCameraStream(stream);
      setUseCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setUseCamera(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Flip horizontally for selfie effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setSelectedImage(file);
            setImagePreview(canvas.toDataURL("image/jpeg"));
            setValidationResult(null);
            stopCamera();
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  // Validate face in the image
  const validateFace = async () => {
    if (!selectedImage) return;
    
    setIsValidating(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      
      const response = await fetch("http://localhost:8000/api/validate-face/", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        setError(data.message);
      } else {
        setValidationResult(data);
      }
    } catch (err) {
      setError("Failed to validate image. Please ensure the backend is running.");
    } finally {
      setIsValidating(false);
    }
  };

  // Save profile picture
  const saveProfilePicture = async () => {
    if (!validationResult?.cropped_face) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch("http://localhost:8000/api/save-profile-pic/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cropped_face: validationResult.cropped_face,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        setError(data.message);
      } else {
        setSavedProfilePic(validationResult.cropped_face);
      }
    } catch (err) {
      setError("Failed to save profile picture.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset everything
  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setValidationResult(null);
    setError(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-6">
            <Shield className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm text-neon-cyan">AI-Powered Verification</span>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            Create Your <span className="text-neon-cyan">Secure Profile</span>
          </h1>
          
          <p className="text-gray-400 max-w-2xl mx-auto">
            Upload a photo of yourself to create your profile. Our AI uses OpenCV face detection
            to ensure only one person is in the photo — keeping our platform bot-free and secure.
          </p>
        </motion.div>

        {/* Success State - Profile Created */}
        {savedProfilePic && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-neon-green">
              <img
                src={savedProfilePic}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 mb-4">
              <Check className="w-5 h-5 text-neon-green" />
              <span className="text-neon-green font-medium">Profile Created Successfully!</span>
            </div>
            
            <p className="text-gray-400 mb-6">
              Your verified profile picture has been saved. You're ready to start learning!
            </p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setSavedProfilePic(null);
                  resetForm();
                }}
                className="neon-button-outline"
              >
                Change Photo
              </button>
              <a href="/dashboard" className="neon-button">
                Go to Dashboard
              </a>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        {!savedProfilePic && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-neon-cyan" />
                Upload Photo
              </h2>

              {/* Camera or Upload Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => {
                    stopCamera();
                    setUseCamera(false);
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                    !useCamera
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                      : "bg-apex-card text-gray-400 border border-apex-border hover:text-white"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  onClick={startCamera}
                  className={cn(
                    "flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                    useCamera
                      ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                      : "bg-apex-card text-gray-400 border border-apex-border hover:text-white"
                  )}
                >
                  <Camera className="w-4 h-4" />
                  Use Camera
                </button>
              </div>

              {/* Camera View */}
              {useCamera && (
                <div className="relative mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg bg-black transform -scale-x-100"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                    <button
                      onClick={capturePhoto}
                      className="p-4 rounded-full bg-neon-cyan text-black hover:bg-neon-cyan/80 transition-colors"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                    <button
                      onClick={stopCamera}
                      className="p-4 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* File Upload */}
              {!useCamera && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {!imagePreview ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-apex-border hover:border-neon-cyan/50 transition-colors flex flex-col items-center justify-center gap-4 group"
                    >
                      <div className="p-4 rounded-full bg-apex-card group-hover:bg-neon-cyan/10 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 group-hover:text-neon-cyan transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium">Click to upload</p>
                        <p className="text-sm text-gray-500">JPEG, PNG or WebP (max 5MB)</p>
                      </div>
                    </button>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Selected"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button
                        onClick={resetForm}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Validate Button */}
              {imagePreview && !validationResult && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={validateFace}
                  disabled={isValidating}
                  className="w-full mt-4 neon-button flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Analyzing Face...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Validate Face
                    </>
                  )}
                </motion.button>
              )}

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Validation Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-neon-cyan" />
                Validation Result
              </h2>

              {!validationResult ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="p-4 rounded-full bg-apex-card mb-4">
                    <Shield className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">
                    Upload a photo and click "Validate Face" to begin verification
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Processed Image Preview */}
                    <div className="relative">
                      <img
                        src={validationResult.preview_image}
                        alt="Analyzed"
                        className="w-full rounded-lg"
                      />
                      
                      {/* Status Badge */}
                      <div className={cn(
                        "absolute top-2 right-2 px-3 py-1 rounded-full flex items-center gap-1",
                        validationResult.validation.is_valid
                          ? "bg-neon-green/20 text-neon-green border border-neon-green/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}>
                        {validationResult.validation.is_valid ? (
                          <>
                            <Check className="w-4 h-4" />
                            Valid
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Invalid
                          </>
                        )}
                      </div>
                    </div>

                    {/* Validation Status */}
                    <div className={cn(
                      "p-4 rounded-lg border",
                      validationResult.validation.is_valid
                        ? "bg-neon-green/10 border-neon-green/30"
                        : "bg-red-500/10 border-red-500/30"
                    )}>
                      <p className={cn(
                        "font-medium",
                        validationResult.validation.is_valid ? "text-neon-green" : "text-red-400"
                      )}>
                        {validationResult.validation.message}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Faces detected: {validationResult.validation.face_count}
                      </p>
                    </div>

                    {/* Quality Metrics */}
                    {validationResult.validation.is_valid && validationResult.quality && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-400">Quality Check</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(validationResult.quality).map(([key, value]) => (
                            <div
                              key={key}
                              className={cn(
                                "p-2 rounded-lg text-center text-sm",
                                value === "good"
                                  ? "bg-neon-green/10 text-neon-green"
                                  : "bg-yellow-500/10 text-yellow-400"
                              )}
                            >
                              <div className="capitalize">{key}</div>
                              <div className="font-medium capitalize">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cropped Face Preview */}
                    {validationResult.cropped_face && (
                      <div className="flex items-center gap-4">
                        <img
                          src={validationResult.cropped_face}
                          alt="Cropped Face"
                          className="w-20 h-20 rounded-full object-cover border-2 border-neon-cyan"
                        />
                        <div>
                          <p className="text-white font-medium">Profile Picture Preview</p>
                          <p className="text-sm text-gray-400">This will be your profile photo</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {validationResult.validation.is_valid ? (
                        <>
                          <button
                            onClick={resetForm}
                            className="flex-1 neon-button-outline"
                          >
                            Try Another
                          </button>
                          <button
                            onClick={saveProfilePicture}
                            disabled={isSaving}
                            className="flex-1 neon-button flex items-center justify-center gap-2"
                          >
                            {isSaving ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Save Profile
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={resetForm}
                          className="w-full neon-button"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          </div>
        )}

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon-cyan" />
            Why We Verify Faces
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-neon-cyan/10">
                <User className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <h4 className="font-medium text-white">Single Face Detection</h4>
                <p className="text-sm text-gray-400">
                  Only one person per profile ensures account authenticity
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-neon-green/10">
                <Shield className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <h4 className="font-medium text-white">Bot Prevention</h4>
                <p className="text-sm text-gray-400">
                  AI verification blocks automated bot accounts
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-neon-pink/10">
                <Eye className="w-5 h-5 text-neon-pink" />
              </div>
              <div>
                <h4 className="font-medium text-white">OpenCV Powered</h4>
                <p className="text-sm text-gray-400">
                  Industry-standard face detection for accuracy
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
