
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  define: {
    // Questo trucco permette all'app di leggere la chiave impostata su Cloudflare
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
