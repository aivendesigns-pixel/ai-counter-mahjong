import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages 子路径：CI 中设置 BASE_PATH=/仓库名/（须带首尾斜杠语义：内部统一成以 / 结尾） */
const raw = process.env.BASE_PATH?.trim()
const normalizedBase =
  !raw || raw === '/'
    ? '/'
    : raw.endsWith('/')
      ? raw
      : `${raw}/`

export default defineConfig({
  base: normalizedBase,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 开发时把 /api/openai 转到 OpenAI，避免浏览器直连 api.openai.com 的 CORS
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
      },
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
      },
    },
  },
})
