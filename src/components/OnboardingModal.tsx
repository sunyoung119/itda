import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Role, User } from '../types'

const ROLES: { role: Role; emoji: string; desc: string }[] = [
  { role: '접수', emoji: '📞', desc: '신고 접수' },
  { role: '관제', emoji: '🚓', desc: '출동 관제' },
  { role: '보고', emoji: '📝', desc: '상황 보고' },
]

/**
 * 첫 방문 시 진입 모달 — 이름 + 직군 입력 후 users 행을 생성한다.
 * 생성된 User 를 onComplete 로 넘기면 useCurrentUser 가 localStorage 에 저장.
 */
export function OnboardingModal({ onComplete }: { onComplete: (u: User) => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = name.trim().length > 0 && role !== null && !submitting

  async function handleStart() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('users')
      .insert({ nickname: name.trim(), role })
      .select()
      .single()

    if (insertError || !data) {
      setError('사용자 생성에 실패했어요. 잠시 후 다시 시도해 주세요.')
      setSubmitting(false)
      return
    }
    onComplete(data as User)
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-6 backdrop-blur-sm">
      <div className="w-full rounded-3xl bg-card p-6 shadow-2xl">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 rotate-[-5deg] items-center justify-center rounded-2xl bg-coral text-2xl shadow-[0_4px_14px_rgba(255,107,107,0.35)]">
            💡
          </div>
        </div>
        <h1 className="mt-3 text-center text-lg font-extrabold tracking-tight">
          Itda에 오신 걸 환영해요
        </h1>
        <p className="mt-1 text-center text-[13px] font-medium text-ink-muted">
          현장의 노하우를 함께 모아요
        </p>

        <label className="mt-6 block text-[13px] font-bold text-ink-soft">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          maxLength={20}
          className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3.5 py-3 text-sm font-medium outline-none transition focus:border-coral"
        />

        <p className="mt-4 text-[13px] font-bold text-ink-soft">직군</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => setRole(r.role)}
              className={`flex flex-col items-center gap-1 rounded-xl border-[1.5px] py-3 transition ${
                role === r.role
                  ? 'border-coral bg-coral-soft'
                  : 'border-border bg-card'
              }`}
            >
              <span className="text-xl">{r.emoji}</span>
              <span className="text-[13px] font-extrabold">{r.role}</span>
              <span className="text-[10px] font-semibold text-ink-muted">{r.desc}</span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-center text-xs font-semibold text-coral-dark">{error}</p>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={!canSubmit}
          className="mt-5 w-full rounded-xl bg-ink py-3.5 text-sm font-extrabold text-white transition disabled:opacity-30"
        >
          {submitting ? '시작하는 중…' : '시작하기'}
        </button>
      </div>
    </div>
  )
}
