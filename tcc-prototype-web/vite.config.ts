import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite config using React plugin. Tailwind plugin removed as project
// migrated to MUI and CSS-in-JS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    watch: {
      usePolling: true,
    },
  },
});
