/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: false,
      padding: '0',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          // Logo Blue #4A90E2 shades
          50: '#e8f4fb',
          100: '#d1e9f7',
          200: '#a3d3ef',
          300: '#75bde7',
          400: '#4a90e2', // Main logo color
          500: '#3a7bc8',
          600: '#2e5c8a', // Dark blue from logo
          700: '#234567',
          800: '#182e45',
          900: '#0d1722',
          950: '#070b11',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          // Success Green #5AB76C shades
          50: '#f0faf2',
          100: '#e1f5e5',
          200: '#c3ebcb',
          300: '#a5e1b1',
          400: '#87d797',
          500: '#5ab76c', // Main green from logo
          600: '#4a9659',
          700: '#397546',
          800: '#295433',
          900: '#183320',
          950: '#0c1910',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Additional logo-inspired colors
        'logo-blue': {
          light: '#e8f4fb',
          DEFAULT: '#4a90e2',
          dark: '#2e5c8a',
        },
        'logo-green': {
          light: '#e1f5e5',
          DEFAULT: '#5ab76c',
          dark: '#397546',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
