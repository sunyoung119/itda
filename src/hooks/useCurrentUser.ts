import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

const STORAGE_KEY = 'itda:user-id'

/**
 * 현재 사용자 식별 (MVP: 인증 없음).
 * localStorage 의 user_id 로 users 행을 조회한다.
 * - user === null && !loading  → 첫 방문 → 온보딩 모달 표시
 */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      setLoading(false)
      return
    }
    supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUser(data as User)
        } else {
          // 존재하지 않는 id(예: DB 재시드) → 정리하고 온보딩 재진행
          localStorage.removeItem(STORAGE_KEY)
        }
        setLoading(false)
      })
  }, [])

  /** 온보딩 완료 시 호출 — user_id 를 저장하고 상태에 반영 */
  function saveUser(u: User) {
    localStorage.setItem(STORAGE_KEY, u.id)
    setUser(u)
  }

  return { user, loading, saveUser }
}
