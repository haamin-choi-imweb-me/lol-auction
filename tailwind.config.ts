import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 사이버펑크 테마 색상
        'cyber-dark': '#0a0a0f',
        'cyber-darker': '#050508',
        'cyber-navy': '#1a1a2e',
        'cyber-purple': '#16213e',
        'neon-cyan': '#00f0ff',
        'neon-magenta': '#ff00aa',
        'neon-gold': '#ffd700',
        'neon-green': '#39ff14',
        'neon-blue': '#00d4ff',
        'neon-pink': '#ff1493',
        'neon-orange': '#ff6600',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        noto: ['Noto Sans KR', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 40px #00f0ff',
        'neon-magenta': '0 0 5px #ff00aa, 0 0 10px #ff00aa, 0 0 20px #ff00aa, 0 0 40px #ff00aa',
        'neon-gold': '0 0 5px #ffd700, 0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 40px #ffd700',
        'neon-sm-cyan': '0 0 2px #00f0ff, 0 0 5px #00f0ff, 0 0 10px #00f0ff',
        'neon-sm-magenta': '0 0 2px #ff00aa, 0 0 5px #ff00aa, 0 0 10px #ff00aa',
        'neon-sm-gold': '0 0 2px #ffd700, 0 0 5px #ffd700, 0 0 10px #ffd700',
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'scan-line': 'scanLine 3s linear infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        glow: {
          'from': { textShadow: '0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 15px #00f0ff' },
          'to': { textShadow: '0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 30px #00f0ff, 0 0 40px #00f0ff' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'cyber-grid': `
          linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
        `,
      },
    },
  },
  plugins: [],
}
export default config

