module.exports = {
  content: ["@/index.html", "./src/**/*.{js,jsx,ts,tsx}", "./**/*.html"],
  theme: {
    screens: {
      sm: { max: "639px" },
      md: { min: "768px", max: "1023px" },
      lg: { min: "1024px" },
    },
    extend: {},
  },
  plugins: [],
};
