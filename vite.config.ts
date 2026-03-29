import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Memisahkan library vendor besar agar tidak menumpuk di chunk utama
            'vendor-ui': ['lucide-react', 'motion', 'clsx', 'tailwind-merge'],
            'vendor-charts': ['recharts'],
            'vendor-flow': ['@xyflow/react', 'dagre'],
            'vendor-excel': ['xlsx'],
            'vendor-react': ['react', 'react-dom']
          }
        }
      },
      chunkSizeWarningLimit: 1000 // Menyesuaikan batas peringatan karena aplikasi visual kompleks
    }
  };
});
