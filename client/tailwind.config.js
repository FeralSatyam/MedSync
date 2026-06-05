/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        alt:     ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Brand ────────────────────────────────────────────────────────
        navy:    { DEFAULT: '#0D1B2A', mid: '#1A2B3C' },
        mint:    { DEFAULT: '#00A878', mid: '#009B6E', light: '#E6F7F3' },

        // ── Status ───────────────────────────────────────────────────────
        red:   { DEFAULT: '#EF4444', light: '#FEF2F2', text: '#B91C1C', tag: '#B91C1C', tagBg: '#FEF2F2' },
        amber: { DEFAULT: '#F59E0B', light: '#FEF3C7', text: '#92400E' },
        green: { DEFAULT: '#00A878', light: '#E6F7F3' },

        // ── Surface ──────────────────────────────────────────────────────
        bg:      '#F0F2F5',   // page background
        card:    '#FFFFFF',   // card / modal surface
        border:  '#E5E7EB',   // default border

        // ── Text ─────────────────────────────────────────────────────────
        muted:   '#6B7280',   // secondary / label text
        faint:   '#F8F9FA',   // alternate surface (inputs, tags)
        navIcon: '#9CA3AF',   // inactive nav icons / placeholders

        // ── Aliases ──────────────────────────────────────────────────────
        primary: '#0D1B2A',
      },
      borderRadius: {
        card:  '16px',    // medicine cards, panels
        btn:   '9999px',  // pill buttons (primary / accent / secondary)
        modal: '20px',    // modals, hero banners
      },
      boxShadow: {
        // Design spec: no drop shadows on cards — borders only
        card:  'none',
        modal: '0 8px 32px rgba(13,27,42,0.12)',
        qr:    '0 4px 20px rgba(13,27,42,0.18)',
      },
    },
  },
  plugins: [],
};
