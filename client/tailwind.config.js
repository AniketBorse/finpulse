/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-slate': '#0F172A',
        'dark-slate': '#1E293B',
        'dark-border': '#334155',
        'stitch-emerald': '#10B981',
        'stitch-crimson': '#EF4444',
        'category-payroll': '#6366F1',
        'category-procurement': '#14B8A6',
        'category-capex': '#F59E0B',
        'category-overhead': '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
