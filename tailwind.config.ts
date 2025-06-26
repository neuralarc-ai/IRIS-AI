import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: { // Added for centering container mx-auto
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Fustat', 'sans-serif'],
        body: ['Fustat', 'sans-serif'],
        headline: ['Fustat', 'sans-serif'],
        code: ['Fustat', 'sans-serif'],
      },
      colors: {
        border: '#ECECEC',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#F7F5F2',
        foreground: 'hsl(var(--foreground))',
        primary: '#C89B6B',
        secondary: '#A6A6A6',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: '#6FCF97', // soft green
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: '#FFFFFF',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
         // Sidebar specific colors are no longer needed as sidebar was removed
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: '1.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(200, 155, 107, 0.06)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
