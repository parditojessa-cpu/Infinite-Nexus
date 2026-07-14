/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        border: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      fontFamily: {
        heading: ["Manrope", "sans-serif"],
        body: ["Public Sans", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        control: "9px",
        pill: "20px",
      },
    },
  },
  plugins: [],
};
