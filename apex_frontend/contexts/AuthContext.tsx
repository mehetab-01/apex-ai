"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_picture?: string;
  display_picture?: string;
  face_validated: boolean;
  onboarding_completed: boolean;
  is_verified: boolean;
  college?: string;
  branch?: string;
  interests?: string[];
  bio?: string;
  focus_points?: number;
  total_focus_time_minutes?: number;
  courses_completed?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = ["/", "/login", "/register"];

// Routes that require authentication but not onboarding completion
const authOnlyRoutes = ["/onboarding"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("apex_user");
      const accessToken = localStorage.getItem("apex_access_token");

      if (storedUser && accessToken) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch {
          // Invalid data, clear storage
          localStorage.removeItem("apex_user");
          localStorage.removeItem("apex_access_token");
          localStorage.removeItem("apex_refresh_token");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isAuthOnlyRoute = authOnlyRoutes.includes(pathname);

    if (!user) {
      // Not authenticated - redirect to login if trying to access protected route
      if (!isPublicRoute) {
        router.push("/login");
      }
    } else {
      // Authenticated user
      if (!user.onboarding_completed && !user.face_validated) {
        // User hasn't completed onboarding - force them to onboarding
        if (!isAuthOnlyRoute && !isPublicRoute) {
          router.push("/onboarding");
        }
      } else if (isAuthOnlyRoute) {
        // User completed onboarding but trying to access onboarding page
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem("apex_user", JSON.stringify(userData));
    localStorage.setItem("apex_access_token", accessToken);
    localStorage.setItem("apex_refresh_token", refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("apex_refresh_token");
    
    try {
      // Call logout API to blacklist token
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear local storage and session storage
    localStorage.removeItem("apex_user");
    localStorage.removeItem("apex_access_token");
    localStorage.removeItem("apex_refresh_token");
    localStorage.removeItem("apex_chat_state"); // Clear chat state on logout
    sessionStorage.removeItem("apex_chat_session_info"); // Clear session for fresh start on next login
    setUser(null);
    router.push("/login");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem("apex_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
