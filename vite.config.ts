import { defineConfig } from 'vite';

// './' makes the built game work from any address (GitHub Pages, Netlify,
// Cloudflare Pages, a custom domain, or inside the Android app later).
export default defineConfig({
  base: './',
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 }, // Phaser itself is ~1.2 MB
});
