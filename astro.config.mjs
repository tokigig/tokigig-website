// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const astroPrerenderEntrypoint = fileURLToPath(new URL(
  './node_modules/astro/dist/entrypoints/prerender.js',
  import.meta.url
));

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://tokigig.com',
  base: '/',

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'astro/entrypoints/prerender': astroPrerenderEntrypoint,
      },
    },
    build: {
      assetsInlineLimit: 4096,     // This is the correct place
    }
  },

  // Future-friendly settings
  server: {
    port: 4321,
  }
});
