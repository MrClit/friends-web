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
      // Radix measures the panel and exposes its height as a CSS variable; tailwindcss-animate does
      // not ship these two, so without them the accordion still works but snaps open and shut.
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
