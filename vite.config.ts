import { defineConfig } from 'vite';

// base must match the repo name so the game works at
// https://<username>.github.io/first_try_at_game/
export default defineConfig({
  base: '/first_try_at_game/',
  server: { host: true },
  build: { chunkSizeWarningLimit: 2000 }, // Phaser itself is ~1.2 MB
});
