import type { ReactNode } from 'react'

/**
 * 하단에서 슬라이드업되는 시트 — 필터 시트, 반응 선택 시트의 공통 셸.
 * 배경(딤)이나 ✕ 를 누르면 onClose.
 */
export function BottomSheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />
      <div className="relative flex max-h-[88%] flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl animate-slide-up">
        <div className="flex flex-shrink-0 items-center justify-between px-[18px] pb-2 pt-4">
          <h2 className="text-[15px] font-extrabold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-bg text-xs text-ink-muted"
          >
            ✕
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex-shrink-0 border-t border-border bg-card px-[18px] py-3">{footer}</div>
        )}
      </div>
    </div>
  )
}
