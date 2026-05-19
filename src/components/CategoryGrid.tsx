import { useEffect, useState } from 'react'
import { fetchTopCategories } from '../lib/queries'
import { isWithin24h } from '../lib/time'
import type { Category } from '../types'

/** [4] 카테고리 — AI 유동 생성, post_count 상위 8개, 4×2 그리드 */
export function CategoryGrid({ refreshSignal }: { refreshSignal: number }) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchTopCategories().then(setCategories)
  }, [refreshSignal])

  return (
    <section>
      <div className="mb-2 mt-3.5 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight">
          📚 카테고리
          <span className="rounded-md bg-coral-soft px-2 py-0.5 text-[10px] font-extrabold text-coral-dark">
            AI 자동 분류
          </span>
        </h2>
        <span className="text-xs font-semibold text-ink-muted">전체 ›</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {categories.map((c) => {
          const isNew = isWithin24h(c.created_at)
          return (
            <div
              key={c.id}
              className={`relative flex flex-col items-center gap-0.5 rounded-[11px] border px-1 py-2 shadow-soft ${
                isNew
                  ? 'border-coral bg-gradient-to-b from-[#FFF8F8] to-white'
                  : 'border-border bg-card'
              }`}
            >
              {isNew && (
                <span className="absolute -right-1 -top-1.5 rounded bg-coral px-1 py-px text-[7px] font-black tracking-wider text-white">
                  NEW
                </span>
              )}
              <span className="text-lg leading-none">{c.emoji}</span>
              <span className="whitespace-nowrap text-[10px] font-bold text-ink-soft">
                {c.name}
              </span>
              <span className="text-[13px] font-extrabold">{c.post_count}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
