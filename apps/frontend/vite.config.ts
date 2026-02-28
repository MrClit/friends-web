import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import type { PluginOption } from 'vite';

const plugins: PluginOption[] = [react(), tailwindcss()];

if (process.env.ANALYZE) {
  const { visualizer } = await import('rollup-plugin-visualizer');
  plugins.push(visualizer({ open: true, filename: 'dist/stats.html' }) as PluginOption);
}

// https://vite.dev/config/
export default defineConfig({
  base: '/friends-web/',
  plugins,
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'tanstack-query': ['@tanstack/react-query'],
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
          ],
          'react-icons': ['react-icons'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/mockData.ts', 'src/main.tsx'],
    },
  },
});
