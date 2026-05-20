import { useState } from 'react'
import { createPost, fetchCategoryNames } from '../lib/queries'
import { structureText, type StructureResult } from '../lib/structure'
import type { User } from '../types'

const STEPS = ['입력 분석 중…', '카테고리 분류 중…', '핵심 요약 생성 중…']

type PostType = 'knowhow' | 'question' | 'relief'
const POST_TYPES: { value: PostType; emoji: string; label: string }[] = [
  { value: 'knowhow', emoji: '💡', label: '노하우' },
  { value: 'question', emoji: '❓', label: '질문' },
  { value: 'relief', emoji: '🎍', label: '해우소' },
]

/** [6] 자연어 입력 — 작성 → Gemini 구조화 → DB 저장 */
export function Compose({ user, onPosted }: { user: User; onPosted: () => void }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [stepIdx, setStepIdx] = useState(0)
  const [result, setResult] = useState<StructureResult | null>(null)
  const [error, setError] = useState('')
  const [postType, setPostType] = useState<PostType>('knowhow')

  const busy = phase === 'processing'
  const canSubmit = text.trim().length >= 5 && !busy

  async function handleSubmit() {
    if (!canSubmit) return
    setPhase('processing')
    setError('')
    setStepIdx(0)
    const timer = setInterval(
      () => setStepIdx((s) => Math.min(s + 1, STEPS.length - 1)),
      1000,
    )
    try {
      const existing = await fetchCategoryNames()
      const structured = await structureText(text.trim(), user.role, existing)
      await createPost(user, text.trim(), structured)
      clearInterval(timer)
      setResult(structured)
      setText('')
      setPhase('done')
      onPosted()
      window.setTimeout(() => {
        setPhase('idle')
        setResult(null)
      }, 4500)
    } catch (e) {
      clearInterval(timer)
      setError(e instanceof Error ? e.message : '등록에 실패했어요.')
      setPhase('error')
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {POST_TYPES.map((t) => {
            const on = postType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setPostType(t.value)}
                className={`rounded-lg border-[1.5px] px-2 py-1 text-[11px] font-extrabold transition ${
                  on
                    ? 'border-coral bg-coral-soft text-coral-dark'
                    : 'border-border bg-card text-ink-soft'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            )
          })}
        </div>
        <span className="flex-shrink-0 rounded-md bg-coral-soft px-2 py-0.5 text-[10px] font-extrabold text-coral-dark">
          AI 자동 정리
        </span>
      </div>

      {phase === 'processing' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-[14px] border border-border bg-card shadow-soft">
          <div className="flex gap-1.5">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="h-2 w-2 animate-bounce rounded-full bg-coral"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
          <div className="text-[13px] font-bold text-ink-soft">{STEPS[stepIdx]}</div>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-[14px] border border-green bg-green-soft px-3.5 py-3">
          <div className="text-[11px] font-extrabold text-[#166534]">✅ AI가 정리해 등록했어요</div>
          <div className="text-sm font-extrabold leading-snug text-ink">{result.title}</div>
          <div className="flex flex-wrap gap-1">
            {result.categories.map((c, i) => (
              <span
                key={c}
                className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink-soft"
              >
                {result.category_emojis[i] ?? '📋'} {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {(phase === 'idle' || phase === 'error') && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 정신질환 의심 신고는 '지금 어디 계세요'보다 '주변에 뭐가 보이세요'라고 물으면 위치 특정이 더 빠름"
          className="flex-1 resize-none rounded-[14px] border-[1.5px] border-border bg-card p-3 text-[13px] leading-relaxed text-ink shadow-soft outline-none placeholder:text-ink-muted focus:border-coral"
        />
      )}

      {error && <p className="text-xs font-semibold text-coral-dark">{error}</p>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" />
          제목·카테고리·태그를 자동 정리
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-xl bg-ink px-4 py-2.5 text-[13px] font-extrabold text-white transition disabled:opacity-30"
        >
          {busy ? '등록 중…' : '등록하기'}
        </button>
      </div>
    </div>
  )
}
