/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        alt: ['"Manrope"', 'sans-serif'],
      },
      colors: {
        navy: { DEFAULT: '#1a2540', mid: '#1a3260' },
        mint: { DEFAULT: '#0f6e56', mid: '#00685f', light: '#e1f5ee' },
        red: { DEFAULT: '#e24b4a', light: '#fcebeb', text: '#a32d2d', tag: '#6e0f0f', tagBg: '#f5e1e1' },
        amber: { DEFAULT: '#ef9f27', light: '#faeeda', text: '#854f0b' },
        green: { DEFAULT: '#1d9e75', light: '#e1f5ee' },
        bg: '#f4f7fb',
        card: '#ffffff',
        border: '#dce3ef',
        muted: '#7c8fa6',
        faint: '#eef1f7',
        primary: '#1a2540',
        navIcon: '#aab8c9',
      },
      borderRadius: {
        card: '20px',
        btn: '20px',
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
