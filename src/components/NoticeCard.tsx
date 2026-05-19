import { useEffect, useState } from 'react'
import { fetchNotice } from '../lib/queries'
import { timeAgo } from '../lib/time'
import type { Notice } from '../types'

/** [2] 공지사항 — 노란 그라데이션 1줄 카드 */
export function NoticeCard() {
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    fetchNotice().then(setNotice)
  }, [])

  if (!notice) return null

  return (
    <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-[#FCD34D] bg-gradient-to-br from-[#FFF8E7] to-yellow-soft px-3 py-2">
      <span className="flex-shrink-0 text-sm">📌</span>
      <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#78350F]">
        {notice.content}
      </span>
      <span className="flex-shrink-0 text-[10px] font-semibold text-[#92400E]">
        {timeAgo(notice.created_at)}
      </span>
    </div>
  )
}
