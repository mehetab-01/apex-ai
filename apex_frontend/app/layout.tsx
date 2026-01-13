import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apex - Next-Gen AI E-Learning Platform",
  description: "Master new skills with AI-powered personalized learning, focus tracking, and intelligent course recommendations.",
  keywords: ["e-learning", "AI", "courses", "education", "programming", "machine learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-apex-dark`}>
        {/* Background Effects */}
        <div className="fixed inset-0 cyber-grid pointer-events-none opacity-30" />
        <div className="fixed inset-0 bg-neon-cyan/3 pointer-events-none" />
        
        {/* Main Content */}
        <AuthProvider>
          <div className="relative z-10">
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
