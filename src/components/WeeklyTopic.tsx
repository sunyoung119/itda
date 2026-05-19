import { useEffect, useState } from 'react'
import { fetchWeeklyTopic, type WeeklyTopicWithCount } from '../lib/queries'

/** [1] 이번 주 화두 — 코랄 풀너비 배너 (탭 동작은 Phase 3) */
export function WeeklyTopic() {
  const [topic, setTopic] = useState<WeeklyTopicWithCount | null>(null)

  useEffect(() => {
    fetchWeeklyTopic().then(setTopic)
  }, [])

  if (!topic) return null

  return (
    <button
      type="button"
      className="-mx-[18px] flex w-[calc(100%+36px)] items-center gap-2.5 bg-gradient-to-br from-coral to-[#FF8E8E] px-[18px] py-3 text-left"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-white/25 text-base">
        💡
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white/75">
          이번 주 화두
        </div>
        <div className="text-[13px] font-extrabold leading-snug text-white">
          {topic.question}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-black leading-none text-white">{topic.answer_count}</div>
        <div className="mt-0.5 text-[9px] font-bold text-white/70">답변</div>
      </div>
    </button>
  )
}
