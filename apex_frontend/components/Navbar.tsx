"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Eye,
  Briefcase,
  MessageSquare,
  Users,
  Menu,
  X,
  UserCircle,
  LogOut,
  ChevronDown,
  Lock,
  Shield,
  BookMarked
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: BookOpen },
  { href: "/focus-mode", label: "Focus Mode", shortLabel: "Focus", icon: Eye },
  { href: "/study-room", label: "Study Room", shortLabel: "Rooms", icon: Users },
  { href: "/career", label: "Career", shortLabel: "Career", icon: Briefcase },
  { href: "/chat", label: "AI Guide", shortLabel: "AI", icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showAuthTooltip, setShowAuthTooltip] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Don't show nav links on auth pages
  const isAuthPage = ["/login", "/register", "/onboarding"].includes(pathname);

  // Handle protected link click
  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
    if (!isAuthenticated) {
      e.preventDefault();
      sessionStorage.setItem("redirectAfterLogin", href);
      router.push("/login");
    }
  };

  return (
    <nav className="relative w-full bg-apex-darker border-b border-white/5 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src="https://i.ibb.co/ynDNpLjn/apex-learning.png"
                alt="Apex Learning"
                className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full object-contain"
              />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                APEX
              </span>
              <span className="text-[9px] sm:text-[10px] text-gray-500 tracking-wider">LEARNING</span>
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          {!isAuthPage && (
            <div className="hidden lg:flex items-center absolute left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 bg-white/[0.03] rounded-full p-1.5 border border-white/5">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;

                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={() => !isAuthenticated && setShowAuthTooltip(link.href)}
                      onMouseLeave={() => setShowAuthTooltip(null)}
                    >
                      <Link
                        href={link.href}
                        onClick={(e) => handleProtectedClick(e, link.href)}
                        className={cn(
                          "relative px-4 py-2 rounded-full flex items-center gap-2 transition-all duration-300 text-sm whitespace-nowrap",
                          isActive
                            ? "text-black font-medium"
                            : isAuthenticated
                              ? "text-gray-400 hover:text-white"
                              : "text-gray-500 hover:text-gray-300"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="navbar-pill"
                            className="absolute inset-0 bg-neon-cyan rounded-full"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{link.label}</span>
                          {!isAuthenticated && (
                            <Lock className="w-3 h-3 text-gray-600" />
                          )}
                        </span>
                      </Link>

                      {/* Tooltip for non-authenticated users */}
                      <AnimatePresence>
                        {showAuthTooltip === link.href && !isAuthenticated && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-3 py-2 bg-apex-darker border border-white/10 rounded-lg shadow-2xl whitespace-nowrap z-50"
                          >
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Shield className="w-3 h-3 text-neon-cyan" />
                              Sign in to access
                            </div>
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-apex-darker border-l border-t border-white/10 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoading ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-apex-card animate-pulse" />
            ) : isAuthenticated ? (
              /* User Menu - Authenticated */
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-full bg-apex-card border border-white/10 hover:border-neon-cyan/30 transition-all"
                >
                  {(user?.display_picture || user?.profile_picture) ? (
                    <img
                      src={user.display_picture || user.profile_picture}
                      alt={user.full_name}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                      <span className="text-xs sm:text-sm font-bold text-black">
                        {user?.full_name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-white hidden sm:block max-w-[80px] truncate">
                    {user?.full_name?.split(" ")[0] || "User"}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform hidden sm:block",
                    userMenuOpen && "rotate-180"
                  )} />
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 py-2 bg-apex-darker rounded-xl border border-white/10 shadow-2xl shadow-black/50 z-50"
                    >
                      <div className="px-4 py-3 border-b border-white/5">
                        <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/my-courses"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <BookMarked className="w-4 h-4" />
                          My Courses
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <UserCircle className="w-4 h-4" />
                          My Profile
                        </Link>
                      </div>

                      <div className="border-t border-white/5 pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Auth Buttons - Not Authenticated */
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 text-sm font-medium bg-neon-cyan text-black rounded-full hover:shadow-lg hover:shadow-neon-cyan/25 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-apex-darker border-b border-white/5 z-50 lg:hidden overflow-hidden"
            >
              <div className="px-4 py-6 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Nav links for everyone on mobile */}
                {!isAuthPage && (
                  <>
                    <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Features
                    </p>
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href;
                      const Icon = link.icon;

                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={(e) => {
                            handleProtectedClick(e, link.href);
                            setMobileMenuOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between px-4 py-3.5 rounded-xl transition-all",
                            isActive
                              ? "bg-neon-cyan text-black font-medium"
                              : isAuthenticated
                                ? "text-gray-300 hover:bg-white/5 hover:text-white"
                                : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isActive ? "bg-black/10" : "bg-white/5"
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-medium">{link.label}</span>
                              {!isAuthenticated && (
                                <p className="text-xs text-gray-500 mt-0.5">Requires sign in</p>
                              )}
                            </div>
                          </div>
                          {!isAuthenticated && (
                            <Lock className="w-4 h-4 text-gray-600" />
                          )}
                        </Link>
                      );
                    })}

                    <div className="border-t border-white/5 my-4" />
                  </>
                )}

                {/* Auth section */}
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-r from-neon-cyan/10 to-transparent rounded-xl">
                      <Shield className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">Secure Community</p>
                        <p className="text-xs text-gray-400 mt-0.5">Face verification protects our platform from bots</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-center py-3 text-gray-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-all font-medium"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-center py-3 bg-neon-cyan text-black font-medium rounded-xl hover:shadow-lg hover:shadow-neon-cyan/25 transition-all"
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/my-courses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-neon-green/10 flex items-center justify-center">
                        <BookMarked className="w-5 h-5 text-neon-green" />
                      </div>
                      <span className="font-medium">My Courses</span>
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-white/5 hover:text-white transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <span className="font-medium">My Profile</span>
                    </Link>

                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <LogOut className="w-5 h-5" />
                      </div>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
