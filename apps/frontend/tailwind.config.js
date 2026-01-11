module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Payment type colors (light variants)
    'text-blue-700',
    'text-red-700',
    'text-green-700',
    'text-orange-800',
    // Dark mode variants
    'dark:text-blue-200',
    'dark:text-red-200',
    'dark:text-green-200',
    'dark:text-orange-200',
    // Strong variants
    'text-blue-800',
    'text-red-800',
    'text-green-800',
  ],
  plugins: [],
};
