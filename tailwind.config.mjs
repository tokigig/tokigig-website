/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        blue: {
          default: '#2563EB',
          hover: '#1D4ED8',
          active: '#1E40AF',
        },
        green: {
          default: '#22C55E',
          alt: '#00C853',
          dark: '#16A34A',
        },
        bg: {
          default: '#F8FAFC',
          secondary: '#F1F5F9',
          card: '#FFFFFF',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        border: {
          default: '#E2E8F0',
          subtle: '#CBD5F5',
          terminal: '#D1D5DB',
        },
        system: {
          cool: '#E5E7EB',
        },
      },
    },
  },
  plugins: [],
};