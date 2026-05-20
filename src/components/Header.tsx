import type { User } from '../types'

/**
 * 상단 헤더 (sticky) — preview-main-v4.html 의 .header 이식.
 * ☰ 사이드바 / ⚲ 필터 시트를 연다. 필터가 적용 중이면 ⚲ 위에 코랄 점을 표시.
 */
export function Header({
  user,
  filterActive,
  onMenu,
  onFilter,
}: {
  user: User | null
  filterActive: boolean
  onMenu: () => void
  onFilter: () => void
}) {
  const initial = user?.nickname.trim().charAt(0) || '?'

  return (
    <header className="relative flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-bg/85 px-[18px] backdrop-blur-xl">
      <button
        type="button"
        aria-label="메뉴"
        onClick={onMenu}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-lg text-ink-soft active:bg-border/60"
      >
        ☰
      </button>

      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <div className="flex h-7 w-7 rotate-[-5deg] items-center justify-center rounded-[9px] bg-coral text-sm shadow-[0_2px_8px_rgba(255,107,107,0.3)]">
          💡
        </div>
        <span className="text-[17px] font-extrabold tracking-tight">잇-다</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="필터"
          onClick={onFilter}
          className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-lg text-ink-soft active:bg-border/60"
        >
          ⚲
          {filterActive && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-bg bg-coral" />
          )}
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-yellow to-coral text-xs font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
          {initial}
        </div>
      </div>
    </header>
  )
}
