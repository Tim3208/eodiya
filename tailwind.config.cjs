/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#002855",
          primaryHover: "#003566",
          onPrimary: "#FFFFFF",
          bg: "#F7F9FC",
        },
      },
    },
  },
  plugins: [],
};
