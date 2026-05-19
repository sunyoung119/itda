import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 없습니다. .env.local 에 ' +
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 설정하세요.',
  )
}

/** 앱 전역에서 사용하는 Supabase 클라이언트 (MVP: 인증 없음, RLS 비활성) */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
