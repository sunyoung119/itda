import { useEffect, useState } from 'react'
import { fetchTopPosts, isFilterActive, type PostWithAuthor } from '../lib/queries'
import type { FilterState, Post } from '../types'
import { RoleBadge } from './RoleBadge'

/** 줄 끝 반응 카운트 — ❤️ / 🔗 / ✅ / 🌱 */
function Reactions({ post }: { post: Post }) {
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 text-[11px] font-bold">
      {post.star_count > 0 && <span className="text-[#B45309]">❤️{post.star_count}</span>}
      {post.bridge_count > 0 && <span className="text-purple">🔗</span>}
      {post.verified_count > 0 && <span className="text-[#166534]">✅{post.verified_count}</span>}
      {post.question_count > 0 && <span className="text-[#1E40AF]">🌱{post.question_count}</span>}
      {post.star_count === 0 &&
        post.verified_count === 0 &&
        post.question_count === 0 && <span className="text-ink-muted">반응하기</span>}
    </div>
  )
}

/**
 * [3] 오늘 가장 빛난 지혜 — TOP 5 목록 (오늘 작성, 별점 순).
 * 행 본문 탭 → 글 상세, 줄 끝 반응 영역 탭 → 반응 시트.
 */
export function TopList({
  filter,
  refreshSignal,
  onOpenPost,
  onOpenReactions,
}: {
  filter: FilterState
  refreshSignal: number
  onOpenPost: (post: PostWithAuthor) => void
  onOpenReactions: (post: PostWithAuthor) => void
}) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])

  useEffect(() => {
    fetchTopPosts(filter).then(setPosts)
  }, [filter, refreshSignal])

  return (
    <section>
      <div className="mb-2 mt-3.5 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold tracking-tight">✨ 오늘 가장 빛난 지혜</h2>
        <span className="text-xs font-semibold text-ink-muted">전체 ›</span>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-[14px] border border-border bg-card px-3 py-7 text-center text-xs font-semibold text-ink-muted shadow-soft">
          {isFilterActive(filter) ? '조건에 맞는 글이 없어요' : '오늘 등록된 글이 아직 없어요'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-soft">
          {posts.map((p, i) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenPost(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onOpenPost(p)
                }
              }}
              className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2.5 last:border-b-0 active:bg-bg"
            >
              <span
                className={`w-[18px] flex-shrink-0 text-center text-xs font-extrabold ${
                  i < 3 ? 'text-coral' : 'text-ink-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                {p.ai_result?.title ?? p.original_text}
              </span>
              <RoleBadge role={p.author_role} />
              <button
                type="button"
                aria-label="반응 남기기"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenReactions(p)
                }}
                className="-mr-1 rounded-md px-1 py-1 active:bg-border/60"
              >
                <Reactions post={p} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
