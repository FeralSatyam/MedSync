/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        navy: { DEFAULT: '#0f1f3d', mid: '#1a3260' },
        mint: { DEFAULT: '#00c896', mid: '#00a87e', light: '#e6faf5' },
        red: { DEFAULT: '#e84040', light: '#fff0f0' },
        amber: { DEFAULT: '#f5a623', light: '#fff8ec' },
        green: { DEFAULT: '#27ae60', light: '#edfaf3' },
        bg: '#f4f6fb',
        card: '#ffffff',
        border: '#e2e8f4',
        muted: '#6b7a99',
        faint: '#9aa5bf',
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(15,31,61,0.08)',
        modal: '0 8px 40px rgba(15,31,61,0.14)',
        qr: '0 4px 22px rgba(15,31,61,0.2)',
      },
    },
  },
  plugins: [],
};
