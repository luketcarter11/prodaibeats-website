/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          accent: '#E50914',
          text: '#f8f8f8',
          background: '#0c0c0c',
          meta: '#999999',
        },
        secondary: {
          background: '#181818',
          text: '#ffffff',
        },
        tertiary: {
          background: '#ffffff',
          text: '#000000',
        },
      },
      fontFamily: {
        heading: ['"Fjalla One"', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        lg: '1rem',
      },
      // If needed, you can define custom font sizes here safely:
      fontSize: {
        xxs: '0.625rem', // 10px
        xxl: '1.5rem',    // 24px
      },
    },
  },
  plugins: [
    // ... existing plugins ...
  ],
  variants: {
    extend: {
      backgroundColor: ['autofill'],
      textColor: ['autofill'],
    },
  },
}
