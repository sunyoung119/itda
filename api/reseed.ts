/**
 * /api/reseed — 시드 데이터 timestamp 를 다시 '지금' 기준으로 갱신하는 서버리스 함수.
 *
 * Vercel Cron(vercel.json 의 schedule)이 매일 1회 호출한다. 인증은
 * Vercel 이 자동으로 붙여 주는 Authorization: Bearer <CRON_SECRET> 헤더로 검증한다.
 *
 * Supabase service-role 키는 이 서버 코드에서만 사용되며 브라우저에 노출되지 않는다.
 * 환경변수 이름에 절대 VITE_ 접두를 붙이지 말 것 — 클라이언트 번들에 들어간다.
 *
 * 로컬에서는 vite.config.ts 의 devApiPlugin 이 같은 경로로 서빙해
 * `npm run dev` 만으로 동작 테스트가 가능하다.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse,
): Promise<void> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return sendJson(res, 500, { error: 'CRON_SECRET 환경변수가 설정되지 않았습니다.' })
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return sendJson(res, 401, { error: 'unauthorized' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return sendJson(res, 500, {
      error: 'VITE_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.',
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await supabase.rpc('refresh_seed_timestamps')
  if (error) {
    return sendJson(res, 500, { error: 'reseed RPC 실패', detail: error.message })
  }

  return sendJson(res, 200, { ok: true, at: new Date().toISOString() })
}
