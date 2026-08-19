import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: 'hsl(var(--color-base) / <alpha-value>)',
          raised: 'hsl(var(--color-base-raised) / <alpha-value>)',
          border: 'hsl(var(--color-border) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'hsl(var(--color-ink) / <alpha-value>)',
          muted: 'hsl(var(--color-ink-muted) / <alpha-value>)',
          faint: 'hsl(var(--color-ink-faint) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          muted: 'hsl(var(--color-accent-muted) / <alpha-value>)',
          ink: 'hsl(var(--color-accent-ink) / <alpha-value>)',
        },
        status: {
          green: 'hsl(var(--color-status-green) / <alpha-value>)',
          amber: 'hsl(var(--color-status-amber) / <alpha-value>)',
          orange: 'hsl(var(--color-status-orange) / <alpha-value>)',
          red: 'hsl(var(--color-status-red) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 0 0 1px hsl(var(--color-border) / 0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
