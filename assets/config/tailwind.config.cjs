const path = require("node:path");
module.exports = {
  darkMode: ["class"],
  content: [path.join(__dirname, "../src/**/*.{ts,tsx}")],
  theme: {
    extend: {
      colors: Object.fromEntries(
        [
          "background",
          "foreground",
          "card",
          "card-foreground",
          "popover",
          "popover-foreground",
          "primary",
          "primary-hover",
          "primary-foreground",
          "secondary",
          "secondary-foreground",
          "muted",
          "muted-foreground",
          "accent",
          "accent-foreground",
          "destructive",
          "destructive-foreground",
          "border",
          "input",
          "ring",
          "canvas-top",
        ].map((token) => [token, `var(--${token})`]),
      ),
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: { xs: "var(--shadow-xs)", sm: "var(--shadow-sm)" },
      transitionDuration: { DEFAULT: "var(--transition)" },
      fontSize: { base: ["13px", "1.65"] },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
