import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 개발 서버에서 api/*.ts 서버리스 함수를 직접 서빙하는 플러그인.
 * 덕분에 `npm run dev` 만으로 (Vercel CLI 없이) /api/structure 와
 * /api/reseed 를 모두 테스트할 수 있다.
 * 운영(Vercel)에서는 api/*.ts 가 그대로 서버리스 함수로 배포된다.
 */
function devApiPlugin(): Plugin {
  const routes: Record<string, string> = {
    '/api/structure': '/api/structure.ts',
    '/api/reseed': '/api/reseed.ts',
  }
  return {
    name: 'itda-dev-api',
    apply: 'serve',
    configureServer(server) {
      for (const [route, modulePath] of Object.entries(routes)) {
        server.middlewares.use(route, async (req, res) => {
          try {
            const mod = await server.ssrLoadModule(modulePath)
            await mod.default(req, res)
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: '개발 API 처리 실패', detail: String(err) }))
          }
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env.local 의 모든 변수를 로드해, 서버리스 함수가 읽는 process.env 에 주입한다.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of [
    'GEMINI_API_KEY',
    'CRON_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
  ]) {
    if (env[key]) process.env[key] = env[key]
  }

  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
  }
})
