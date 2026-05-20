import { useEffect, useState, type ReactNode } from 'react'
import { fetchTopCategories } from '../lib/queries'
import type { Category, FilterState, ReactionType, Role } from '../types'
import { BottomSheet } from './BottomSheet'

const ROLES: Role[] = ['접수', '관제', '보고']
const REACTIONS: { value: 'all' | ReactionType; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'star', label: '❤️ 유용' },
  { value: 'verified', label: '✅ 검증' },
  { value: 'question', label: '🌱 의문' },
]

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-[1.5px] px-3 py-1.5 text-xs font-bold transition ${
        active
          ? 'border-coral bg-coral-soft text-coral-dark'
          : 'border-border bg-card text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * 필터 시트 — 카테고리(다중)·직군(다중)·반응타입(단일).
 * draft 에 모았다가 "적용하기" 를 눌러야 onApply 로 전달된다.
 */
export function FilterSheet({
  current,
  onClose,
  onApply,
}: {
  current: FilterState
  onClose: () => void
  onApply: (f: FilterState) => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [draft, setDraft] = useState<FilterState>(current)

  useEffect(() => {
    fetchTopCategories(30).then(setCategories)
  }, [])

  function toggleCategory(name: string) {
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(name)
        ? d.categories.filter((c) => c !== name)
        : [...d.categories, name],
    }))
  }

  function toggleRole(role: Role) {
    setDraft((d) => ({
      ...d,
      roles: d.roles.includes(role) ? d.roles.filter((r) => r !== role) : [...d.roles, role],
    }))
  }

  return (
    <BottomSheet
      title="🔎 필터"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDraft({ categories: [], roles: [], reaction: 'all' })}
            className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-ink-soft"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-xl bg-ink py-3 text-sm font-extrabold text-white"
          >
            적용하기
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-[18px] pb-5 pt-2">
        <section>
          <h3 className="mb-2 text-xs font-extrabold text-ink-soft">카테고리</h3>
          <div className="flex flex-wrap gap-1.5">
            {categories.length === 0 ? (
              <span className="text-xs font-semibold text-ink-muted">불러오는 중…</span>
            ) : (
              categories.map((c) => (
                <Chip
                  key={c.id}
                  active={draft.categories.includes(c.name)}
                  onClick={() => toggleCategory(c.name)}
                >
                  {c.emoji} {c.name}
                </Chip>
              ))
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-extrabold text-ink-soft">직군</h3>
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={draft.roles.length === 0}
              onClick={() => setDraft((d) => ({ ...d, roles: [] }))}
            >
              전체
            </Chip>
            {ROLES.map((r) => (
              <Chip key={r} active={draft.roles.includes(r)} onClick={() => toggleRole(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-extrabold text-ink-soft">반응 타입</h3>
          <div className="flex flex-wrap gap-1.5">
            {REACTIONS.map((r) => (
              <Chip
                key={r.value}
                active={draft.reaction === r.value}
                onClick={() => setDraft((d) => ({ ...d, reaction: r.value }))}
              >
                {r.label}
              </Chip>
            ))}
          </div>
        </section>
      </div>
    </BottomSheet>
  )
}
