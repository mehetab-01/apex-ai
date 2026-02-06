"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Zap,
  Loader2,
  CheckCircle,
  KeyRound,
} from "lucide-react";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.status === "error") {
        if (data.auth_provider === "google") {
          setError(
            "This account uses Google Sign-In. Please sign in with Google."
          );
        } else {
          setError(data.message || "Failed to send OTP");
        }
      } else {
        setStep("otp");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp_code: otp,
            new_password: password,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "error") {
        setError(data.message || data.errors?.non_field_errors?.[0] || "Failed to reset password");
      } else {
        setStep("success");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setError(null);
        alert("New OTP sent to your email!");
      }
    } catch (err) {
      setError("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="p-2 rounded-lg bg-neon-cyan">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <span className="text-2xl font-bold text-neon-cyan">APEX</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6">
            {step === "success" ? "Password Reset!" : "Reset Password"}
          </h1>
          <p className="text-gray-400 mt-2">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "otp" && "Enter the OTP sent to your email"}
            {step === "password" && "Create a new password"}
            {step === "success" && "Your password has been reset successfully"}
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-6">
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: Email Input */}
          {step === "email" && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full neon-button flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Input */}
          {step === "otp" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex-1 py-3 px-4 bg-apex-card border border-apex-border rounded-lg text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (otp.length === 6) {
                      setStep("password");
                    } else {
                      setError("Please enter a valid 6-digit OTP");
                    }
                  }}
                  disabled={otp.length !== 6}
                  className="flex-1 neon-button flex items-center justify-center gap-2"
                >
                  Verify
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="w-full text-sm text-neon-cyan hover:underline mt-2"
              >
                Didn't receive the code? Resend OTP
              </button>
            </motion.div>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={8}
                    className="w-full pl-10 pr-12 py-3 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep("otp")}
                  className="flex-1 py-3 px-4 bg-apex-card border border-apex-border rounded-lg text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 neon-button flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/30">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <p className="text-gray-300">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full neon-button flex items-center justify-center gap-2"
              >
                Go to Sign In
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Back to Login Link */}
          {step !== "success" && (
            <p className="mt-6 text-center text-gray-400">
              Remember your password?{" "}
              <Link href="/login" className="text-neon-cyan hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
