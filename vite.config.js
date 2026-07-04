import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_URL || '/',
  server: {
    port: 3000,
    host: true
  }
});
