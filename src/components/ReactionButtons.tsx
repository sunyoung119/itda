import { useEffect, useState } from 'react'
import { computeToggle, fetchMyReactions, persistReaction } from '../lib/reactions'
import type { Post, ReactionType, User } from '../types'

/** ⭐/✅/❓ 3개 반응 버튼 메타 (claude-code-prompt.md 반응 선택 시트) */
const META: {
  type: ReactionType
  emoji: string
  label: string
  desc: string
  active: string
}[] = [
  {
    type: 'star',
    emoji: '⭐',
    label: '유용했어요',
    desc: '도움이 되는 인사이트네요',
    active: 'border-yellow bg-yellow-soft',
  },
  {
    type: 'verified',
    emoji: '✅',
    label: '나도 검증함',
    desc: '현장에서 실제로 적용해봤어요',
    active: 'border-green bg-green-soft',
  },
  {
    type: 'question',
    emoji: '❓',
    label: '상황 다름',
    desc: '내 케이스에선 다른 결과였어요',
    active: 'border-blue bg-blue-soft',
  },
]

/**
 * 반응 버튼 묶음 — 반응 시트와 글 상세에서 공용 사용.
 * 낙관적 업데이트: DB 응답 전에 내 반응/카운트를 먼저 반영하고,
 * persistReaction 실패 시 직전 상태로 롤백한다.
 */
export function ReactionButtons({
  post,
  user,
  onChanged,
}: {
  post: Post
  user: User
  onChanged?: () => void
}) {
  const [mine, setMine] = useState<ReactionType[]>([])
  const [counts, setCounts] = useState<Record<ReactionType, number>>({
    star: post.star_count,
    verified: post.verified_count,
    question: post.question_count,
  })
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetchMyReactions(post.id, user.id).then((r) => {
      if (alive) {
        setMine(r)
        setReady(true)
      }
    })
    return () => {
      alive = false
    }
  }, [post.id, user.id])

  async function tap(type: ReactionType) {
    if (busy || !ready) return
    const prevMine = mine
    const prevCounts = counts
    const { next, added, removed } = computeToggle(mine, type)

    // 낙관적 반영
    const nextCounts = { ...counts }
    for (const r of removed) nextCounts[r] = Math.max(0, nextCounts[r] - 1)
    for (const a of added) nextCounts[a] = nextCounts[a] + 1
    setMine(next)
    setCounts(nextCounts)
    setBusy(true)

    try {
      await persistReaction(post, user, type, prevMine)
      onChanged?.()
    } catch {
      setMine(prevMine)
      setCounts(prevCounts)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {META.map((m) => {
        const on = mine.includes(m.type)
        return (
          <button
            key={m.type}
            type="button"
            onClick={() => tap(m.type)}
            disabled={busy || !ready}
            className={`flex items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 text-left transition active:scale-[0.99] disabled:opacity-60 ${
              on ? m.active : 'border-border bg-card'
            }`}
          >
            <span className="text-2xl leading-none">{m.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-ink">{m.label}</div>
              <div className="truncate text-[11px] font-semibold text-ink-muted">{m.desc}</div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-base font-black text-ink">{counts[m.type]}</div>
              <div className="text-[9px] font-bold text-ink-muted">{on ? '내 반응' : '명'}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
