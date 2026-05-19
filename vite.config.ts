import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 개발 서버에서 /api/structure 서버리스 함수를 직접 서빙하는 플러그인.
 * 덕분에 `npm run dev` 만으로 (Vercel CLI 없이) AI 구조화 API를 테스트할 수 있다.
 * 운영(Vercel)에서는 api/structure.ts 가 그대로 서버리스 함수로 배포된다.
 */
function devApiPlugin(): Plugin {
  return {
    name: 'relay-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/structure', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('/api/structure.ts')
          await mod.default(req, res)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: '개발 API 처리 실패', detail: String(err) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env.local 의 모든 변수를 로드해, 서버리스 함수가 읽는 process.env 에 주입한다.
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY

  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
  }
})
