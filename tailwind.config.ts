import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'zen-beige': '#f5f0eb',
        'zen-ink': '#2c2c2c',
        'zen-gray': '#e8e4e0',
      },
    },
  },
  plugins: [],
}
export default config
