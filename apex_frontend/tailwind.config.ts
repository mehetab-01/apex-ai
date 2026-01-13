import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Cyberpunk/SaaS Dark Theme Colors
        apex: {
          dark: "#0a0a0f",
          darker: "#050508",
          card: "#111118",
          border: "#1e1e2e",
          muted: "#71717a",
        },
        neon: {
          cyan: "#00f5ff",
          pink: "#ff00ff",
          purple: "#a855f7",
          blue: "#3b82f6",
          green: "#00ff88",
          yellow: "#ffff00",
          orange: "#ff8800",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyber-grid": `linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        "cyber-grid": "50px 50px",
      },
      animation: {
        "glow": "glow 2s ease-in-out infinite alternate",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "scan-line": "scan-line 8s linear infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 245, 255, 0.5), 0 0 10px rgba(0, 245, 255, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 245, 255, 0.8), 0 0 30px rgba(0, 245, 255, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 5px rgba(0, 245, 255, 0.5), 0 0 20px rgba(0, 245, 255, 0.3)",
        "neon-pink": "0 0 5px rgba(255, 0, 255, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)",
        "neon-green": "0 0 5px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
