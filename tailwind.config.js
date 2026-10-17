module.exports = {
  darkMode: "class",
  purge: ["./src/**/*.js"],
  theme: {
    extend: {
      // Hero Feature bump: a burst that pops then fades, and a quick cat wobble
      keyframes: {
        burst: {
          "0%": { transform: "translate(-50%, -50%) scale(0.3)", opacity: "1" },
          "40%": {
            transform: "translate(-50%, -50%) scale(1.2)",
            opacity: "1",
          },
          "100%": { transform: "translate(-50%, -50%) scale(1)", opacity: "0" },
        },
        wobble: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-12deg)" },
          "75%": { transform: "rotate(12deg)" },
        },
      },
      animation: {
        burst: "burst 0.6s ease-out forwards",
        wobble: "wobble 0.3s ease-in-out",
      },
    },
  },
  variants: {},
  plugins: [],
};
