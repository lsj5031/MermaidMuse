import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@theme': path.resolve(__dirname, './src/theme'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
        env.VITE_STRIPE_PUBLISHABLE_KEY || ''
      ),
      'import.meta.env.VITE_STRIPE_KEY': JSON.stringify(env.VITE_STRIPE_KEY || ''),
      'import.meta.env.VITE_MOCK_PRO': JSON.stringify(env.VITE_MOCK_PRO || ''),
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
    },
  };
});
