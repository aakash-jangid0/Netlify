import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
  },
  // Make sure environment variables are properly exposed
  define: {
    // This allows us to replace process.env.NODE_ENV with the actual value
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});
