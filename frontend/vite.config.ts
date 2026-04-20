import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Configuration volontairement minimaliste :
//   - Vite gere automatiquement le code splitting par route via React.lazy()
//     (cf. App.tsx) -> les visiteurs des landings ne telechargent que ce
//     dont ils ont besoin.
//   - On NE PAS faire de manualChunks complexe : c'est ce qui a casse le
//     site (cycle de dependance entre 'react' et 'vendor' chunks ->
//     "Cannot read properties of undefined (reading 'createContext')").
//   - On NE PAS pre-compresser en .br/.gz : Apache mod_deflate ne supporte
//     pas bien les fichiers deja compresses (il les re-compresse, le
//     navigateur recoit ERR_CONTENT_DECODING_FAILED). Le .htaccess fait
//     deja une compression dynamique gzip a la volee, c'est tres bien.

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
