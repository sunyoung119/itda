import type { Post, User } from '../types'
import { BottomSheet } from './BottomSheet'
import { ReactionButtons } from './ReactionButtons'

/** 반응 선택 시트 — 카드의 반응 카운트 영역 탭 시 하단에서 열린다 */
export function ReactionSheet({
  post,
  user,
  onClose,
  onChanged,
}: {
  post: Post
  user: User
  onClose: () => void
  onChanged: () => void
}) {
  return (
    <BottomSheet title="반응 남기기" onClose={onClose}>
      <div className="px-[18px] pb-6 pt-1">
        <p className="mb-3 line-clamp-2 rounded-[12px] bg-bg px-3 py-2 text-[13px] font-bold leading-snug text-ink-soft">
          {post.ai_result?.title ?? post.original_text}
        </p>
        <ReactionButtons post={post} user={user} onChanged={onChanged} />
      </div>
    </BottomSheet>
  )
}
