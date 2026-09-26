import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Project site: https://itsflutoe.github.io/FET/
export default defineConfig({
  plugins: [react()],
  base: '/FET/',
});
