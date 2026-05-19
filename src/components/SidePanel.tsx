import type { ReactNode } from 'react'

/**
 * 우측에서 슬라이드인되는 패널 — 사이드바의 공통 셸.
 * 배경(딤)을 누르면 onClose. 헤더는 children 쪽에서 직접 그린다.
 */
export function SidePanel({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />
      <div className="absolute right-0 top-0 flex h-full w-[84%] max-w-[340px] flex-col bg-bg shadow-2xl animate-slide-in">
        {children}
      </div>
    </div>
  )
}
