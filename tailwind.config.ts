import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'zen-beige': '#f5f0eb',
        'zen-ink': '#2c2c2c',
        'zen-gray': '#e8e4e0',
      },
      fontFamily: {
        'sans': ['var(--font-geist-sans)'],
        'mono': ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
}
export default config
