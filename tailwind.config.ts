import { type Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        texturina: ["var(--font-texturina)", "Georgia", "serif"],
      },
      colors: {
        accent: "var(--accent)",
        "accent-bright": "var(--accent-bright)",
        "accent-dim": "var(--accent-dim)",
        "accent-glow": "var(--accent-glow)",
        "bg-base": "var(--bg-base)",
        "bg-surface": "var(--bg-surface)",
        "bg-card": "var(--bg-card)",
        "bg-card-hover": "var(--bg-card-hover)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-muted": "var(--bg-muted)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-disabled": "var(--text-disabled)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        "border-focus": "var(--border-focus)",
        "imdb-gold": "var(--imdb-gold)",
      },
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [],
};

export default config;
