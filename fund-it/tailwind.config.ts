import type { Config } from 'tailwindcss';

// Electric Minimal, the Fund It design system.
// See: anthropic-skills/fund-it-design for the full rationale behind each choice.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#10131A',
        surface: '#171B24',
        'surface-raised': '#1E2330',
        border: '#262B38',
        text: '#E8ECF5',
        'text-muted': '#8B93A6',
        violet: { DEFAULT: '#6C4CFF', soft: 'rgba(108,76,255,0.18)' },
        lime: { DEFAULT: '#C6FF3D', soft: 'rgba(198,255,61,0.18)' },
        coral: { DEFAULT: '#FF5C7A', soft: 'rgba(255,92,122,0.18)' },
        mint: { DEFAULT: '#2EE6A6', soft: 'rgba(46,230,166,0.18)' },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '18px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
