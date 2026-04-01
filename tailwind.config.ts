import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "430px" },
    },
    extend: {
      fontFamily: {
        heading: ["Fredoka", "sans-serif"],
        body: ["Nunito", "sans-serif"],
        handwriting: ["Dancing Script", "cursive"],
        game: ["Itim", "cursive"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
          pale: "hsl(var(--primary-pale))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          dark: "hsl(var(--secondary-dark))",
          light: "hsl(var(--secondary-light))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          dark: "hsl(var(--destructive-dark))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        game: {
          green: {
            dark: "hsl(var(--green-dark))",
            mid: "hsl(var(--green-mid))",
            light: "hsl(var(--green-light))",
            pale: "hsl(var(--green-pale))",
          },
          gold: {
            DEFAULT: "hsl(var(--gold))",
            dark: "hsl(var(--gold-dark))",
            light: "hsl(var(--gold-light))",
          },
          brown: {
            DEFAULT: "hsl(var(--brown))",
            dark: "hsl(var(--brown-dark))",
            light: "hsl(var(--brown-light))",
          },
          red: "hsl(var(--farm-red))",
          blue: "hsl(var(--farm-blue))",
          sky: "hsl(var(--farm-sky))",
        },
        farm: {
          "green-dark": "#2d6a4f",
          "green-light": "#52b788",
          brown: "#8c6239",
          "brown-dark": "#5d4037",
          straw: "#e9c46a",
          sky: "#a8dadc",
          carrot: "#e76f51",
          paper: "#fdf6e3",
          cream: "#fefae0",
        },
        ink: {
          blue: "#2c3e50",
        },
        spiritual: {
          purple: "#9d8189",
        },
        spirit: {
          gold: "#ffd700",
          light: "#fefee2",
        },
        wood: {
          light: "#d7c0a0",
          dark: "#6d4c41",
        },
        boss: {
          dark: "hsl(var(--boss-dark))",
          mid: "hsl(var(--boss-mid))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "24px",
        "2xl": "32px",
      },
      backgroundImage: {
        "wood-pattern": "repeating-linear-gradient(45deg, #8c6239 0, #8c6239 10px, #7a5230 10px, #7a5230 20px)",
        "grass-gradient": "linear-gradient(180deg, #52b788 0%, #2d6a4f 100%)",
        "sacred-gradient": "linear-gradient(180deg, #d9f99d 0%, #4ade80 50%, #166534 100%)",
        "paper-texture": "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
        "vine-border": "url('https://www.transparenttextures.com/patterns/floral-linen.png')",
      },
      boxShadow: {
        "wood-shadow": "0 4px 0 #5d4037, 0 5px 10px rgba(0,0,0,0.3)",
        "paper-shadow": "0 2px 0 #d4c5a3, 0 3px 6px rgba(0,0,0,0.1)",
        "inner-glow": "inset 0 2px 4px rgba(255,255,255,0.4)",
        "leaf-shadow": "0 4px 0 #1b4332, 0 5px 10px rgba(0,0,0,0.2)",
        "glow": "0 0 15px rgba(255, 215, 0, 0.6)",
        "soft-glow": "0 0 15px rgba(255, 255, 200, 0.5)",
        "parchment": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 0 20px rgba(139, 69, 19, 0.1)",
        "book-shadow": "5px 5px 15px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "plant-sway": {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        "float-up": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-60px)" },
        },
        "cloud-drift": {
          "0%": { transform: "translateX(-60px)" },
          "100%": { transform: "translateX(420px)" },
        },
        "splash-progress": {
          "0%": { width: "0%" },
          "60%": { width: "70%" },
          "100%": { width: "100%" },
        },
        "splash-in": {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "logo-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "float-leaf": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-15px) rotate(10deg)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "boss-idle": {
          // Removed scale() — causes recomposite. translateY only = pure compositor layer.
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "damage-float": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-40px)", opacity: "0" },
        },
        "event-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(231,76,60,0.3)" },
          "50%": { boxShadow: "0 0 0 6px rgba(231,76,60,0)" },
        },
        "sun-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.1)", opacity: "1" },
        },
        "sparkle-up": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-30px) scale(0.3)", opacity: "0" },
        },
        "ult-glow": {
          // Removed box-shadow animation — constant GPU compositing. Use opacity only.
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        "gem-pop": {
          // Simplified: removed scale-up and rotate — saves GPU compositing on 20+ gems
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.6)", opacity: "0" },
        },
        "gem-land": {
          "0%": { transform: "translateY(-15px) scale(0.8)", opacity: "0" },
          "40%": { transform: "translateY(5px) scale(1.15)", opacity: "1" },
          "70%": { transform: "translateY(-3px) scale(0.95)" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "gem-swap": {
          "0%": { transform: "scale(0.85)", opacity: "0.8" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "match-ring": {
          "0%": { transform: "scale(0)", opacity: "1", borderWidth: "4px" },
          "100%": { transform: "scale(2.5)", opacity: "0", borderWidth: "0px" },
        },
        "match-flash": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "15%": { transform: "scale(1.1)", opacity: "0.9" },
          "100%": { transform: "scale(1.3)", opacity: "0" },
        },
        "grid-shake": {
          "0%, 100%": { transform: "translateX(0) translateY(0)" },
          "15%": { transform: "translateX(-3px) translateY(1px)" },
          "30%": { transform: "translateX(3px) translateY(-1px)" },
          "45%": { transform: "translateX(-2px) translateY(1px)" },
          "60%": { transform: "translateX(2px)" },
          "75%": { transform: "translateX(-1px)" },
        },
        "star-burst": {
          "0%": { transform: "rotate(0deg) scale(0)", opacity: "1" },
          "50%": { transform: "rotate(180deg) scale(1.2)", opacity: "0.8" },
          "100%": { transform: "rotate(360deg) scale(0)", opacity: "0" },
        },
        "gem-hint": {
          // Simplified: opacity-only pulse — no transform to avoid 64-gem layout thrash
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        "bug-wiggle": {
          "0%, 100%": { transform: "rotate(-8deg) scale(1)" },
          "25%": { transform: "rotate(8deg) scale(1.1)" },
          "50%": { transform: "rotate(-5deg) scale(0.95)" },
          "75%": { transform: "rotate(6deg) scale(1.05)" },
        },
        "rain-drop": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0.3" },
        },
        "snow-fall": {
          "0%": { transform: "translateY(-10px) translateX(0) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { transform: "translateY(100vh) translateX(30px) rotate(360deg)", opacity: "0.2" },
        },
        "storm-flash": {
          "0%, 94%, 100%": { opacity: "0" },
          "95%": { opacity: "0.6" },
          "96%": { opacity: "0" },
          "97%": { opacity: "0.3" },
        },
        "wind-blow": {
          "0%": { transform: "translateX(-100px)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateX(500px)", opacity: "0" },
        },
        "heat-shimmer": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        "screen-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%": { transform: "translateX(-6px)" },
          "20%": { transform: "translateX(6px)" },
          "30%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "50%": { transform: "translateX(-2px)" },
          "60%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "combo-burst": {
          "0%": { transform: "translateX(-50%) scale(0.3)", opacity: "0" },
          "50%": { transform: "translateX(-50%) scale(1.2)", opacity: "1" },
          "100%": { transform: "translateX(-50%) scale(1)", opacity: "1" },
        },
        "boss-attack": {
          "0%": { transform: "translateY(0) scale(1)" },
          "15%": { transform: "translateY(-20px) scale(1.15)" },
          "30%": { transform: "translateY(10px) scale(1.2)" },
          "50%": { transform: "translateY(-5px) scale(1.1)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "boss-atk-flash": {
          "0%": { background: "transparent" },
          "15%": { background: "rgba(231,76,60,0.25)" },
          "30%": { background: "transparent" },
          "45%": { background: "rgba(231,76,60,0.15)" },
          "60%": { background: "transparent" },
          "100%": { background: "transparent" },
        },
        "ult-flash": {
          "0%": { background: "rgba(108,92,231,0.4)" },
          "25%": { background: "rgba(224,86,253,0.3)" },
          "50%": { background: "rgba(108,92,231,0.5)" },
          "75%": { background: "rgba(162,155,254,0.2)" },
          "100%": { background: "rgba(108,92,231,0.1)" },
        },
        "dodge-pulse": {
          // Removed box-shadow animation — constant GPU repaint. Transform + opacity only.
          "0%, 100%": { transform: "scale(1.1)", opacity: "0.8" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
        },
        "prayer-ascend": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "30%": { transform: "translateY(-20px) scale(1.15)", opacity: "1" },
          "100%": { transform: "translateY(-120px) scale(0.5)", opacity: "0" },
        },
        "prayer-glow": {
          // Removed box-shadow animation — constant GPU repaint. Opacity only.
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "button-vibrate": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-2px) translateY(1px) rotate(-1deg)" },
          "40%": { transform: "translateX(2px) translateY(-1px) rotate(1deg)" },
          "60%": { transform: "translateX(-1px) translateY(1px) rotate(0deg)" },
          "80%": { transform: "translateX(1px) translateY(-1px) rotate(1deg)" },
        },
        "button-pop": {
          "0%": { transform: "scale(0.95)" },
          "40%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        "gem-spawn": {
          // Removed filter:brightness — expensive CSS filter per spawning gem
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.3)", opacity: "1" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)" },
        },
        "combat-float-up": {
          "0%": { transform: "translateY(0) scale(0.8)", opacity: "0" },
          "20%": { transform: "translateY(-10px) scale(1)", opacity: "1" },
          "70%": { transform: "translateY(-40px) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-60px) scale(0.9)", opacity: "0" },
        },
        "fire-flicker": {
          // Removed drop-shadow filter — extremely expensive on mobile. Opacity only.
          "0%": { opacity: "0.8" },
          "100%": { opacity: "1" },
        },

        "screen-shake-violent": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-10px, -15px) rotate(-1deg)" },
          "20%": { transform: "translate(15px, 10px) rotate(2deg)" },
          "30%": { transform: "translate(-15px, 15px) rotate(-2deg)" },
          "40%": { transform: "translate(10px, -10px) rotate(1deg)" },
          "50%": { transform: "translate(-10px, 0px) rotate(0deg)" },
          "60%": { transform: "translate(15px, 0px) rotate(-1deg)" },
          "70%": { transform: "translate(0px, -15px) rotate(2deg)" },
          "80%": { transform: "translate(0px, 15px) rotate(-1deg)" },
          "90%": { transform: "translate(-8px, -8px) rotate(0deg)" },
        },
        "rage-pulse": {
          "0%": { opacity: "0.3" },
          "100%": { opacity: "0.8" },
        },
        "bolt-flash": {
          // Removed filter:brightness — expensive per lightning bolt
          "0%": { opacity: "0" },
          "10%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "heal-pulse": {
          // Removed box-shadow animation — expensive GPU repaint. Opacity only.
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { opacity: "0", transform: "scale(1)" },
        },
        "hp-damage-flash": {
          "0%": { backgroundColor: "rgba(239, 68, 68, 0.6)", borderColor: "rgba(239, 68, 68, 0.8)" },
          "100%": { backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.06)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "plant-sway": "plant-sway 4s ease-in-out infinite",
        "float-up": "float-up 1.2s ease-out forwards",
        "cloud-drift": "cloud-drift 25s linear infinite",
        "splash-progress": "splash-progress 2.5s ease-in-out forwards",
        "splash-in": "splash-in 1s ease-out",
        "logo-pulse": "logo-pulse 2s ease-in-out infinite",
        "float-leaf": "float-leaf 6s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "boss-idle": "boss-idle 3s ease-in-out infinite",
        "damage-float": "damage-float 1.2s ease-out forwards",
        "event-pulse": "event-pulse 2s ease-in-out infinite",
        "sun-pulse": "sun-pulse 3s ease-in-out infinite",
        "sparkle-up": "sparkle-up 1s ease-out forwards",
        "ult-glow": "ult-glow 1.5s ease-in-out infinite",
        "gem-pop": "gem-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "gem-land": "gem-land 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "gem-swap": "gem-swap 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "match-ring": "match-ring 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards",
        "match-flash": "match-flash 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards",
        "grid-shake": "grid-shake 0.35s ease-out",
        "star-burst": "star-burst 0.6s ease-out forwards",
        "bug-wiggle": "bug-wiggle 0.5s ease-in-out infinite",
        "rain-drop": "rain-drop 1s linear infinite",
        "snow-fall": "snow-fall 5s linear infinite",
        "storm-flash": "storm-flash 4s ease-in-out infinite",
        "wind-blow": "wind-blow 2s linear infinite",
        "heat-shimmer": "heat-shimmer 3s ease-in-out infinite",
        "screen-shake": "screen-shake 0.5s ease-out",
        "screen-shake-violent": "screen-shake-violent 0.8s ease-in-out infinite",
        "scale-in": "scale-in 0.3s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "combo-burst": "combo-burst 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bolt-flash": "bolt-flash 0.3s ease-out forwards",
        "boss-attack": "boss-attack 0.6s ease-out",
        "boss-atk-flash": "boss-atk-flash 0.8s ease-out",
        "ult-flash": "ult-flash 1.5s ease-out",
        "dodge-pulse": "dodge-pulse 0.4s ease-in-out infinite",
        "prayer-ascend": "prayer-ascend 1s ease-out forwards",
        "prayer-glow": "prayer-glow 2s ease-in-out infinite",
        "button-vibrate": "button-vibrate 0.3s ease-in-out infinite",
        "button-pop": "button-pop 0.25s ease-out forwards",
        "gem-spawn": "gem-spawn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "gem-hint": "gem-hint 2s ease-in-out infinite",
        "rage-pulse": "rage-pulse 1s alternate infinite",
        "combat-float-up": "combat-float-up 1.2s ease-out forwards",
        "fire-flicker": "fire-flicker 0.1s infinite alternate",
        "heal-pulse": "heal-pulse 0.5s ease-out",
        "hp-damage-flash": "hp-damage-flash 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
