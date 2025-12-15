// tailwind.config.ts
import { type Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',           // ✅ Scan everything in src/
    './src/app/**/*.{ts,tsx,js,jsx}',       // ✅ Explicit app directory
    './src/components/**/*.{ts,tsx,js,jsx}', // ✅ Explicit components
  ],
  theme: {
    extend: {}
  },
  plugins: [
    require('tailwindcss-animate')
  ]
} satisfies Config
