"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Shield,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type LoginMethod = "email" | "phone" | "google";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const countryCodes = [
    { code: "+91", label: "🇮🇳 +91", country: "India" },
    { code: "+1", label: "🇺🇸 +1", country: "US/CA" },
    { code: "+44", label: "🇬🇧 +44", country: "UK" },
    { code: "+61", label: "🇦🇺 +61", country: "Australia" },
    { code: "+971", label: "🇦🇪 +971", country: "UAE" },
    { code: "+65", label: "🇸🇬 +65", country: "Singapore" },
    { code: "+49", label: "🇩🇪 +49", country: "Germany" },
    { code: "+81", label: "🇯🇵 +81", country: "Japan" },
    { code: "+86", label: "🇨🇳 +86", country: "China" },
    { code: "+33", label: "🇫🇷 +33", country: "France" },
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.onboarding_completed && user.face_validated) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    }
  }, [isAuthenticated, user, router]);

  // Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsGoogleUser(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/email/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === "error") {
        // Check if this is a Google user trying to login with email/password
        if (data.require_google_signin) {
          setIsGoogleUser(true);
          setError("This account was created with Google Sign-In.");
        } else {
          setError(data.errors?.non_field_errors?.[0] || data.message || "Login failed");
        }
      } else {
        // Use auth context login
        login(data.user, data.tokens.access, data.tokens.refresh);

        // Redirect based on onboarding status
        if (data.onboarding_completed) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Phone login - send OTP
  const handlePhoneSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/phone/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: countryCode + phone.replace(/^\+/, "") }),
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        setError(data.errors?.phone_number?.[0] || "Failed to send OTP");
      } else {
        setOtpSent(true);
        // In debug mode, backend may include debug_otp if SMS delivery failed
        if (data.debug_otp) {
          console.log(`[DEV] OTP: ${data.debug_otp}`);
          setError(`SMS delivery may have failed (Twilio trial limitation). Debug OTP: ${data.debug_otp}`);
        }
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: countryCode + phone.replace(/^\+/, ""), otp_code: otp }),
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        setError(data.message || "Invalid OTP");
      } else {
        login(data.user, data.tokens.access, data.tokens.refresh);
        
        if (data.onboarding_completed) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      setError("Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign In - rendered button approach (reliable)
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  const handleGoogleCredentialResponse = useCallback(async (response: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await apiResponse.json();

      if (data.status === "error") {
        setError(data.message || "Google login failed");
      } else {
        login(data.user, data.tokens.access, data.tokens.refresh);
        if (data.onboarding_completed) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      setError("Failed to authenticate with Google");
    } finally {
      setIsLoading(false);
    }
  }, [login, router]);

  const initializeGoogleSignIn = useCallback(() => {
    const { google } = window as any;
    if (!google || !googleButtonRef.current) return;

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
    });

    google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: googleButtonRef.current.offsetWidth,
    });

    setGoogleScriptLoaded(true);
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    if (googleScriptLoaded) return;
    // If script was already loaded (e.g. navigated back), initialize immediately
    const { google } = window as any;
    if (google && googleButtonRef.current) {
      initializeGoogleSignIn();
    }
  }, [googleScriptLoaded, initializeGoogleSignIn]);

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
          <h1 className="text-2xl font-bold text-white mt-6">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in to continue your learning journey</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6">
          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: "email", label: "Email", icon: Mail },
              { id: "phone", label: "Phone", icon: Phone },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setLoginMethod(method.id as LoginMethod);
                  setError(null);
                  setOtpSent(false);
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                  loginMethod === method.id
                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30"
                    : "bg-apex-card text-gray-400 border border-apex-border hover:text-white"
                )}
              >
                <method.icon className="w-4 h-4" />
                {method.label}
              </button>
            ))}
          </div>

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
                {isGoogleUser && (
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full py-2 px-3 bg-white hover:bg-gray-100 text-gray-900 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </button>
                    <Link
                      href="/forgot-password"
                      className="w-full py-2 px-3 bg-apex-card border border-apex-border rounded-lg text-neon-cyan text-sm font-medium text-center hover:bg-apex-border/50 transition-colors"
                    >
                      Or set a password
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Login Form */}
          {loginMethod === "email" && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm text-neon-cyan hover:underline">
                  Forgot password?
                </Link>
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
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone Login Form */}
          {loginMethod === "phone" && (
            <form onSubmit={otpSent ? handleVerifyOTP : handlePhoneSendOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={otpSent}
                    className="w-28 py-3 px-2 bg-apex-darker border border-apex-border rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 disabled:opacity-50 text-sm"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                      required
                      disabled={otpSent}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {otpSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
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
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setError(null);
                    }}
                    className="mt-2 text-sm text-neon-cyan hover:underline"
                  >
                    Change phone number
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePhoneSendOTP()}
                    disabled={isLoading}
                    className="mt-1 text-sm text-gray-400 hover:text-neon-cyan hover:underline"
                  >
                    Resend OTP
                  </button>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full neon-button flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : otpSent ? (
                  <>
                    Verify OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-apex-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-apex-card text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In - Rendered by Google SDK for reliability */}
          <div
            ref={googleButtonRef}
            className="w-full flex items-center justify-center [&>div]:w-full [&_iframe]:rounded-lg"
          />
          {!googleScriptLoaded && (
            <div className="w-full py-3 px-4 bg-white/10 text-gray-400 font-medium rounded-lg flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Google Sign-In...
            </div>
          )}

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-neon-cyan hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Shield className="w-4 h-4" />
          <span>Secured with face-validated profiles</span>
        </div>
      </motion.div>

      {/* Google Sign-In Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />
    </div>
  );
}
