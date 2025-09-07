/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(210, 40%, 98%)',
        accent: 'hsl(222, 47%, 50%)',
        danger: 'hsl(0, 60%, 50%)',
        primary: 'hsl(222, 47%, 11%)',
        success: 'hsl(140, 60%, 50%)',
        surface: 'hsl(0, 0%, 100%)',
        'text-primary': 'hsl(222, 47%, 11%)',
        'text-secondary': 'hsl(220, 10%, 40%)',
      },
      borderRadius: {
        'lg': '16px',
        'md': '10px',
        'sm': '6px',
      },
      boxShadow: {
        'card': '0 4px 12px hsla(0, 0%, 0%, 0.08)',
      },
      spacing: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '32px',
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
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
