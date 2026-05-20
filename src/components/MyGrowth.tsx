import { useEffect, useState } from 'react'
import { fetchGrowth, type GrowthStats } from '../lib/queries'
import type { User } from '../types'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

/** [5] 내 성장 — 주간 바차트 + 작성/❤️/🔗/🌱 + 도움 횟수 (순위 표시 없음) */
export function MyGrowth({ user, refreshSignal }: { user: User; refreshSignal: number }) {
  const [stats, setStats] = useState<GrowthStats | null>(null)

  useEffect(() => {
    fetchGrowth(user.id).then(setStats)
  }, [user.id, refreshSignal])

  const bars = stats?.weekBars ?? [0, 0, 0, 0, 0, 0, 0]
  const max = Math.max(1, ...bars)
  const todayIdx = (new Date().getDay() + 6) % 7

  return (
    <div className="flex items-center gap-3.5 rounded-[14px] border border-border bg-card px-3.5 py-3 shadow-soft">
      <div className="flex flex-shrink-0 flex-col items-center gap-1">
        <div className="flex h-9 items-end gap-[3px]">
          {bars.map((v, i) => (
            <div
              key={i}
              className={`w-2 rounded-t ${
                i === todayIdx
                  ? 'bg-coral animate-bar-pulse'
                  : v > 0
                    ? 'bg-coral'
                    : 'bg-border'
              }`}
              style={{ height: `${6 + (v / max) * 24}px` }}
            />
          ))}
        </div>
        <div className="flex gap-[3px]">
          {DAYS.map((d, i) => (
            <span
              key={d}
              className={`w-2 text-center text-[8px] font-bold ${
                i === todayIdx ? 'text-coral' : 'text-ink-muted'
              }`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 truncate text-[13px] font-extrabold tracking-tight">
          {user.nickname} 님의 이번 주
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap text-[11px] font-bold text-ink-soft">
          <span>
            작성 <span className="text-[13px] font-black text-coral">{stats?.postCount ?? 0}</span>
          </span>
          <span>
            ❤️ <span className="text-[13px] font-black text-ink">{stats?.stars ?? 0}</span>
          </span>
          <span>
            🔗 <span className="text-[13px] font-black text-ink">{stats?.bridges ?? 0}</span>
          </span>
          <span>
            🌱 <span className="text-[13px] font-black text-ink">{stats?.questions ?? 0}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center self-stretch rounded-2xl border-[3px] border-green bg-green-soft px-4 text-[#166534]">
        <span className="whitespace-nowrap text-[13px] font-black">
          {stats?.helpedCount ?? 0}명에게 도움
        </span>
      </div>
    </div>
  )
}
