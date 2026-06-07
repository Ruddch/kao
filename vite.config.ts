import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      // Polyfill Node.js `events` for packages like @aave/account used by ConnectKit
      events: 'rollup-plugin-node-polyfills/polyfills/events',
    },
  },
});
