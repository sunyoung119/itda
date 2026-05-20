import { useEffect, useState } from 'react'
import { fetchCategoriesByName, type PostWithAuthor } from '../lib/queries'
import { isWithin24h, timeAgo } from '../lib/time'
import type { User } from '../types'
import { ReactionButtons } from './ReactionButtons'
import { RoleBadge } from './RoleBadge'

/**
 * 글 상세 화면 — 카드 클릭 시 우측에서 슬라이드인되는 전체 화면.
 * AI 제목/요약/카테고리·태그 + 원문 인용 + 큰 반응 버튼 + 직군 횡단 표시.
 */
export function PostDetail({
  post,
  user,
  onClose,
  onChanged,
}: {
  post: PostWithAuthor
  user: User
  onClose: () => void
  onChanged: () => void
}) {
  const ai = post.ai_result
  const [newCats, setNewCats] = useState<Set<string>>(new Set())

  useEffect(() => {
    const names = ai?.categories ?? []
    if (names.length === 0) return
    fetchCategoriesByName(names).then((cats) => {
      setNewCats(
        new Set(cats.filter((c) => isWithin24h(c.created_at)).map((c) => c.name)),
      )
    })
  }, [post.id, ai])

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-bg animate-slide-in">
      <header className="flex h-14 flex-shrink-0 items-center gap-1 border-b border-border bg-bg/90 px-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="뒤로"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-2xl leading-none text-ink-soft"
        >
          ‹
        </button>
        <span className="text-[15px] font-extrabold tracking-tight">지혜 자세히</span>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-[18px] py-4">
        <h1 className="text-xl font-extrabold leading-snug tracking-tight text-ink">
          {ai?.title ?? '제목 없음'}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-bold text-ink-soft">
            {post.users?.nickname ?? '익명'}
          </span>
          <RoleBadge role={post.author_role} />
          <span className="text-[11px] font-semibold text-ink-muted">
            · {timeAgo(post.created_at)}
          </span>
          {post.bridge_count > 0 && (
            <span className="ml-auto rounded-md bg-purple-soft px-2 py-0.5 text-[10px] font-extrabold text-[#5B21B6]">
              🔗 직군 횡단 {post.bridge_count}
            </span>
          )}
        </div>

        {ai && (ai.categories.length > 0 || ai.tags.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ai.categories.map((c, i) => (
              <span
                key={c}
                className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${
                  newCats.has(c) ? 'border-coral text-coral-dark' : 'border-border text-ink-soft'
                }`}
              >
                {ai.category_emojis[i] ?? '📋'} {c}
                {newCats.has(c) && (
                  <span className="rounded bg-coral px-1 text-[8px] font-black tracking-wider text-white">
                    NEW
                  </span>
                )}
              </span>
            ))}
            {ai.tags.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-ink-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {ai?.summary && (
          <div className="mt-4 rounded-[14px] border border-border bg-card p-3.5 shadow-soft">
            <div className="mb-1 text-[11px] font-extrabold text-coral-dark">AI 요약</div>
            <p className="text-[13px] font-medium leading-relaxed text-ink-soft">{ai.summary}</p>
          </div>
        )}

        <div className="mt-3">
          <div className="mb-1 text-[11px] font-extrabold text-ink-muted">원문</div>
          <blockquote className="rounded-r-[12px] border-l-[3px] border-coral bg-card py-2.5 pl-3 pr-3 text-[13px] font-medium leading-relaxed text-ink-soft">
            {post.original_text}
          </blockquote>
        </div>

        <div className="mt-5 pb-2">
          <div className="mb-2 text-[13px] font-extrabold text-ink">이 지혜에 반응하기</div>
          <ReactionButtons post={post} user={user} onChanged={onChanged} />
        </div>
      </div>
    </div>
  )
}
