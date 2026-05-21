import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f59e0b', // yellow-500
          dark: '#d97706',
        },
        dark: {
          DEFAULT: '#0f1720',
          card: '#111827',
          nav: '#1f2937',
        },
      },
    },
  },
  plugins: [],
};
export default config;
