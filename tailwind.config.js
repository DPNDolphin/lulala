/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(237, 90, 143)', // 玫红色主题色
        'primary-light': 'rgb(245, 120, 165)',
        'primary-dark': 'rgb(220, 70, 125)',
        background: {
          DEFAULT: 'rgb(15, 15, 15)',
          secondary: 'rgb(25, 25, 25)',
          card: 'rgb(35, 35, 35)',
        },
        text: {
          primary: 'rgb(255, 255, 255)',
          secondary: 'rgb(200, 200, 200)',
          muted: 'rgb(150, 150, 150)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 6s ease infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
    },
  },
  plugins: [],
}
