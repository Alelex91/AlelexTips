
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Necessario per GitHub Pages (alelex91.github.io/AlelexTips/)
  build: {
    outDir: 'dist',
  }
});
