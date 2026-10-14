import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import type { PluginOption } from 'vite';

const plugins: PluginOption[] = [react(), tailwindcss()];

if (process.env.ANALYZE) {
  const { visualizer } = await import('rollup-plugin-visualizer');
  plugins.push(visualizer({ open: true, filename: 'dist/stats.html' }) as PluginOption);
}

// The product version lives only in the root package.json, which each release bumps. The commit is
// known only inside GitHub Actions (the Pages deploy); elsewhere it stays empty and the UI omits it.
const rootManifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
  version: string;
};
const commit = process.env.GITHUB_SHA?.slice(0, 7) ?? '';

// https://vite.dev/config/
export default defineConfig({
  base: '/friends-web/',
  plugins,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(rootManifest.version),
    'import.meta.env.VITE_APP_COMMIT': JSON.stringify(commit),
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router'],
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
