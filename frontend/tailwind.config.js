/** Theme tokens: change colours/fonts here and the whole app updates. */
module.exports = {
  content: ["./**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        navy:     { DEFAULT: "#1B2547", dark: "#121A35" },
        burgundy: { DEFAULT: "#6B1D29", dark: "#4A1519" },
        cream:    { DEFAULT: "#F4EFEA", text: "#EFE8E2" },
        gold:     "#C9A24B",
        ink:      { DEFAULT: "#1F1416", soft: "#4F4346" },
        line:     "#E2D8D1",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};