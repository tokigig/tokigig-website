// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://tokigig.com',
  base: '/',

  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 4096,     // This is the correct place
    }
  },

  // Future-friendly settings
  server: {
    port: 4321,
  }
});