import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import ViteWebfontDownload from 'vite-plugin-webfont-dl';

export default defineConfig({
  define: {
    'process.env': {}
  },
  base: '/',
  plugins: [
    react(),
    ViteWebfontDownload(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pranay Yelugam Portfolio',
        short_name: 'Pranay Portfolio',
        description: 'Portfolio of Pranay Yelugam - Senior Software Engineer',
        theme_color: '#0a0a0f',
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg}']
      }
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],

          ui: ['react-icons', 'classnames']
        }
      }
    }
  },
});
