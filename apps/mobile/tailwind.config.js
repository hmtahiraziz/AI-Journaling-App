/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#C4E562",
        secondary: "#00CFEE",
        ink: "#FEFEFE",
        night: "#01122F",
        glass: {
          DEFAULT: "rgba(254,254,254,0.08)",
          border: "rgba(254,254,254,0.18)",
          strong: "rgba(254,254,254,0.14)",
        },
        muted: "rgba(254,254,254,0.55)",
      },
      fontFamily: {
        display: ["Fraunces_600SemiBold"],
        displayItalic: ["Fraunces_500Medium_Italic"],
        sans: ["DMSans_400Regular"],
        sansMedium: ["DMSans_500Medium"],
        sansBold: ["DMSans_700Bold"],
      },
      maxWidth: {
        content: "520px",
      },
    },
  },
  plugins: [],
};
