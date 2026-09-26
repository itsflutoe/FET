import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel serves at the project root (e.g. https://fet.vercel.app)
export default defineConfig({
  plugins: [react()],
  base: '/',
});
