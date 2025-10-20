/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {
  keyframes: {
    float: {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-5px)' },
    },
  },
  animation: {
    float: 'float 4s ease-in-out infinite',
  },
} },
  plugins: [require('tailwind-scrollbar')],

};
