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
  User,
  Loader2,
  Check,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type RegisterMethod = "email" | "phone";

export default function RegisterPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "verify">("form");
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

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

  // Password strength checker
  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  // Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email: registerMethod === "email" ? email : undefined,
          phone_number: registerMethod === "phone" ? countryCode + phone.replace(/^\+/, "") : undefined,
          password,
          password_confirm: confirmPassword,
          auth_provider: registerMethod,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        const errors = data.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
        } else {
          setError("Registration failed");
        }
      } else {
        // Don't login yet - wait for OTP verification
        // Show OTP in dev mode only
        if (data.otp_code) {
          alert(`Development OTP: ${data.otp_code}`);
        }

        // Move to OTP verification step
        setStep("verify");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerMethod === "email" ? email : undefined,
          phone_number: registerMethod === "phone" ? countryCode + phone.replace(/^\+/, "") : undefined,
          otp_code: otp,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === "error") {
        setError(data.message || "Invalid OTP");
      } else {
        // Update using auth context
        login(data.user, data.tokens.access, data.tokens.refresh);
        
        // Redirect to onboarding for face validation
        router.push("/onboarding");
      }
    } catch (err) {
      setError("Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign Up - rendered button approach (reliable)
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
        setError(data.message || "Google sign up failed");
      } else {
        login(data.user, data.tokens.access, data.tokens.refresh);
        router.push("/onboarding");
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
      text: "signup_with",
      shape: "rectangular",
      logo_alignment: "left",
      width: googleButtonRef.current.offsetWidth,
    });

    setGoogleScriptLoaded(true);
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    if (googleScriptLoaded) return;
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
          <h1 className="text-2xl font-bold text-white mt-6">Create Your Account</h1>
          <p className="text-gray-400 mt-2">
            {step === "form" 
              ? "Join thousands of learners on Apex" 
              : "Verify your account to continue"
            }
          </p>
        </div>

        {/* Registration Card */}
        <div className="glass-card p-6">
          {step === "form" ? (
            <>
              {/* Register Method Tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: "email", label: "Email", icon: Mail },
                  { id: "phone", label: "Phone", icon: Phone },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setRegisterMethod(method.id as RegisterMethod);
                      setError(null);
                    }}
                    className={cn(
                      "flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors",
                      registerMethod === method.id
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
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                    />
                  </div>
                </div>

                {/* Email or Phone */}
                {registerMethod === "email" ? (
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
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-28 py-3 px-2 bg-apex-darker border border-apex-border rounded-lg text-white focus:outline-none focus:border-neon-cyan/50 text-sm"
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
                          placeholder="9876543210"
                          className="w-full pl-10 pr-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password */}
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
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-apex-border"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password strength: {strengthLabels[passwordStrength - 1] || "Too weak"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-apex-darker border border-apex-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                    />
                    {confirmPassword && password === confirmPassword && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || passwordStrength < 2}
                  className="w-full neon-button flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-apex-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-apex-card text-gray-500">Or sign up with</span>
                </div>
              </div>

              {/* Google Sign Up - Rendered by Google SDK for reliability */}
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
            </>
          ) : (
            /* OTP Verification Step */
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-neon-cyan" />
                </div>
                <p className="text-gray-400">
                  We sent a verification code to{" "}
                  <span className="text-white font-medium">
                    {registerMethod === "email" ? email : phone}
                  </span>
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-apex-darker border border-apex-border rounded-lg text-white text-center text-3xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full neon-button flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={() => {/* Resend OTP logic */}}
                  className="text-neon-cyan hover:underline"
                >
                  Resend
                </button>
              </p>
            </form>
          )}

          {/* Sign In Link */}
          {step === "form" && (
            <p className="mt-6 text-center text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-neon-cyan hover:underline">
                Sign in
              </Link>
            </p>
          )}
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
