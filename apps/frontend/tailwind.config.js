module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Payment type colors (light variants)
    'text-blue-700',
    'text-rose-700',
    'text-emerald-700',
    'text-amber-800',
    // Dark mode variants
    'dark:text-blue-200',
    'dark:text-rose-200',
    'dark:text-emerald-200',
    'dark:text-amber-200',
    // Strong variants
    'text-blue-800',
    'text-rose-800',
    'text-emerald-800',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
