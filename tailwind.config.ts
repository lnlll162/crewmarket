import type { Config } from 'tailwindcss';
import { heroui } from '@heroui/react';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  darkMode: 'class',
  // Hero UI 与 Tailwind 3 类型不完全兼容，运行时正常
  plugins: [heroui() as never],
};

export default config;
