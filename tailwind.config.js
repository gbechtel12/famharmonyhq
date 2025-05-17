/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  important: true, // Override MUI styles
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'Poppins', 'Comic Neue', 'sans-serif'],
      },
      fontSize: {
        'base': '16px', // Larger base font size
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      colors: {
        primary: {
          50: '#e8f1fe',
          100: '#c5dcfd',
          200: '#9dc2fb',
          300: '#79b0ff',
          400: '#5595f7',
          500: '#4585f5', // Main primary color (friendly blue)
          600: '#3a73d8',
          700: '#2c64c1',
          800: '#1d4282',
          900: '#0e2143',
        },
        secondary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a', // Soft green
          500: '#66bb6a',
          600: '#4caf50', 
          700: '#43a047',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        error: {
          50: '#ffebe4',
          100: '#ffcab8',
          200: '#ffa989',
          300: '#ff8c61',
          400: '#ff7043', // Softer orange-red
          500: '#ff5722',
          600: '#f4511e',
          700: '#e64a19',
          800: '#d84315',
          900: '#c63f17',
        },
        warning: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ffb74d', // Warm orange
          600: '#ffa726',
          700: '#ff9800',
          800: '#ef6c00',
          900: '#e65100',
        },
        accent: {
          50: '#e1f5fe',
          100: '#b3e5fc',
          200: '#81d4fa',
          300: '#4fc3f7',
          400: '#29b6f6', // Light blue (info color)
          500: '#03a9f4',
          600: '#039be5',
          700: '#0288d1',
          800: '#0277bd',
          900: '#01579b',
        },
        background: {
          light: '#f8f9fa',
          dark: '#121212',
          paper: '#ffffff',
          paperDark: '#1e1e1e'
        },
        // Additional pastel colors for UI accents
        pastel: {
          blue: '#d0e8ff',
          green: '#d0f0c0',
          yellow: '#fcf3cf',
          orange: '#ffe0b2',
          purple: '#e1d5f5',
          pink: '#ffdde1',
        }
      },
      boxShadow: {
        'button': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 6px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'transform': 'transform',
      },
      transitionDuration: {
        '300': '300ms',
      },
      animation: {
        'bounce-light': 'bounce 1s ease-in-out infinite',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable preflight to avoid conflicts with MUI
  },
} 