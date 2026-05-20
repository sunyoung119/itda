import { useEffect, useState } from 'react'
import { fetchTodayPosts, isFilterActive, type PostWithAuthor } from '../lib/queries'
import { timeAgo } from '../lib/time'
import type { FilterState } from '../types'
import { RoleBadge } from './RoleBadge'
import { SidePanel } from './SidePanel'

/**
 * 사이드바 — 오늘 올라온 글 전체 (시간 역순). 필터가 적용되면 그 결과를 보여준다.
 * 항목 탭 시 글 상세로 이동.
 */
export function Sidebar({
  filter,
  refreshSignal,
  onClose,
  onOpenPost,
}: {
  filter: FilterState
  refreshSignal: number
  onClose: () => void
  onOpenPost: (post: PostWithAuthor) => void
}) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchTodayPosts(filter).then((p) => {
      setPosts(p)
      setLoading(false)
    })
  }, [filter, refreshSignal])

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const filtered = isFilterActive(filter)

  return (
    <SidePanel onClose={onClose}>
      <header className="flex-shrink-0 border-b border-border bg-card px-[18px] py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-tight">
            {filtered ? '🔎 필터 결과' : '📅 오늘의 지혜'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-bg text-xs text-ink-muted"
          >
            ✕
          </button>
        </div>
        <p className="mt-0.5 text-xs font-semibold text-ink-muted">
          {today} · {posts.length}건
        </p>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <p className="py-12 text-center text-xs font-semibold text-ink-muted">불러오는 중…</p>
        ) : posts.length === 0 ? (
          <p className="py-12 text-center text-xs font-semibold text-ink-muted">
            {filtered ? '조건에 맞는 글이 없어요' : '오늘 등록된 글이 아직 없어요'}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {posts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPost(p)}
                className="rounded-[12px] border border-border bg-card px-3 py-2.5 text-left shadow-soft active:scale-[0.99]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-ink-soft">
                    {p.users?.nickname ?? '익명'}
                  </span>
                  <RoleBadge role={p.author_role} />
                  <span className="ml-auto text-[10px] font-semibold text-ink-muted">
                    {timeAgo(p.created_at)}
                  </span>
                </div>
                <div className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-ink">
                  {p.ai_result?.title ?? p.original_text}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold">
                  {p.star_count > 0 && <span className="text-[#B45309]">❤️{p.star_count}</span>}
                  {p.bridge_count > 0 && <span className="text-purple">🌉{p.bridge_count}</span>}
                  {p.verified_count > 0 && (
                    <span className="text-[#166534]">✅{p.verified_count}</span>
                  )}
                  {p.question_count > 0 && (
                    <span className="text-[#1E40AF]">🌱{p.question_count}</span>
                  )}
                  {p.star_count === 0 &&
                    p.verified_count === 0 &&
                    p.question_count === 0 &&
                    p.bridge_count === 0 && (
                      <span className="text-ink-muted">아직 반응 없음</span>
                    )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </SidePanel>
  )
}
