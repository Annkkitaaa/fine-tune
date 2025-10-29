// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        // Add refresh for better DX
      
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@store': path.resolve(__dirname, './src/store'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@constants': path.resolve(__dirname, './src/constants'),
      },
    },

    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      // Add CORS headers for development
      cors: true,
    },

    build: {
      // Output directory
      outDir: 'dist',
      
      // Generate sourcemaps for easier debugging
      sourcemap: true,
      
      // Optimize chunking
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              'react',
              'react-dom',
              'react-router-dom',
              'zustand',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-dialog',
              'lucide-react',
            ],
          },
        },
      },
      
      // Minimize bundle size
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // Changed to false for debugging
          drop_debugger: false, // Changed to false for debugging
        },
      },

      // Added CommonJS options for Spheron SDK
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
      },
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        '@radix-ui/react-alert-dialog',
        '@radix-ui/react-dialog',
        'lucide-react',
        '@spheron/protocol-sdk', // Added Spheron SDK
      ],
      exclude: ['@auth/core'],
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis',
        },
      },
    },

    // Add define to fix Node.js environment variables
    define: {
      'process.env': JSON.stringify({
        ...env,
        NODE_ENV: mode
      }),
      'global': 'globalThis',
    },
  };
});