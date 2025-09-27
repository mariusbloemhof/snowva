import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      css: {
        postcss: {
          plugins: [
            autoprefixer,
            cssnano({ 
              preset: ['default', {
                // Preserve CSS custom properties for design tokens
                normalizeWhitespace: false,
                discardComments: { removeAll: false },
                // Optimize for design system
                reduceIdents: false,
                mergeRules: false,
                // Constitutional compliance - preserve token references
                customProperties: true,
                calc: false,
                // Disable SVGO to prevent SVG data URI parsing errors
                svgo: false
              }]
            })
          ]
        },
        // CSS import handling with optimization
        devSourcemap: true
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          '@styles': path.resolve(__dirname, './styles'),
          '@components': path.resolve(__dirname, './components'),
          '@utils': path.resolve(__dirname, './utils'),
          '@contexts': path.resolve(__dirname, './contexts'),
          '@services': path.resolve(__dirname, './services'),
        }
      },
      // Build optimization for design system
      build: {
        // CSS optimization
        cssCodeSplit: false, // Keep all CSS in one file for design system
        rollupOptions: {
          output: {
            // Separate CSS assets
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'assets/styles/[name]-[hash][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            },
            // Chunk splitting for better caching
            manualChunks: {
              // Design system chunks
              'design-system': [
                './styles/index.css',
                './utils/themeUtils.ts',
                './utils/typeUtils.ts',
                './utils/statusUtils.ts',
                './utils/statusColors.ts'
              ],
              // UI components
              'ui-components': [
                './contexts/ThemeContext.tsx',
                './contexts/ToastContext.tsx'
              ]
            }
          }
        },
        // Performance targets
        target: 'es2018',
        minify: 'terser',
        terserOptions: {
          compress: {
            // Preserve design system functionality
            keep_fnames: true,
            keep_classnames: true,
          }
        }
      },
      // Development optimizations
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom'
        ]
      }
    };
});
