import { supabase } from './supabase'
import type { Post, ReactionType, User } from '../types'

/** 한 글에 대한 현재 사용자의 반응 타입 목록 */
export async function fetchMyReactions(postId: string, userId: string): Promise<ReactionType[]> {
  const { data } = await supabase
    .from('reactions')
    .select('type')
    .eq('post_id', postId)
    .eq('user_id', userId)
  return ((data as { type: ReactionType }[]) ?? []).map((r) => r.type)
}

export interface ToggleResult {
  /** 토글 후 사용자의 반응 목록 */
  next: ReactionType[]
  /** 새로 INSERT 할 반응 */
  added: ReactionType[]
  /** DELETE 할 반응 */
  removed: ReactionType[]
}

/**
 * 반응 토글 규칙(claude-code-prompt.md 반응 무결성):
 * - 이미 누른 반응을 다시 누르면 해제(토글)
 * - ❤️ + ✅ 는 양립 가능
 * - 🌱 을 새로 누르면 같은 글의 ❤️ 는 자동 해제
 */
export function computeToggle(current: ReactionType[], type: ReactionType): ToggleResult {
  if (current.includes(type)) {
    return { next: current.filter((t) => t !== type), added: [], removed: [type] }
  }
  const removed: ReactionType[] = []
  let base = current
  if (type === 'question' && current.includes('star')) {
    removed.push('star')
    base = current.filter((t) => t !== 'star')
  }
  return { next: [...base, type], added: [type], removed }
}

const COUNT_COL: Record<ReactionType, 'star_count' | 'verified_count' | 'question_count'> = {
  star: 'star_count',
  verified: 'verified_count',
  question: 'question_count',
}
const TOTAL_COL: Record<ReactionType, 'total_stars' | 'total_verified' | 'total_questions'> = {
  star: 'total_stars',
  verified: 'total_verified',
  question: 'total_questions',
}

/**
 * 반응을 DB 에 반영한다. 호출 측(ReactionButtons)이 낙관적 UI 를 먼저 갱신하고,
 * 이 함수가 실패하면 직전 상태로 롤백한다.
 * - reactions INSERT/DELETE
 * - posts 카운트 동기화 — bridge_count 는 INSERT 트리거가 처리하므로
 *   DELETE 시에만 직접 차감한다.
 * - 글 작성자 users.total_* 동기화
 */
export async function persistReaction(
  post: Pick<Post, 'id' | 'user_id' | 'author_role'>,
  user: User,
  type: ReactionType,
  current: ReactionType[],
): Promise<void> {
  const { added, removed } = computeToggle(current, type)
  if (added.length === 0 && removed.length === 0) return
  const isBridge = user.role !== post.author_role

  for (const r of removed) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .eq('type', r)
    if (error) throw new Error('반응을 해제하지 못했어요.')
  }
  for (const a of added) {
    const { error } = await supabase
      .from('reactions')
      .insert({ post_id: post.id, user_id: user.id, type: a })
    if (error) throw new Error('반응을 저장하지 못했어요.')
  }

  // posts 카운트 (트리거가 bridge_count 를 올리므로 INSERT 직후 최신값을 읽는다)
  const { data: p } = await supabase
    .from('posts')
    .select('star_count, verified_count, question_count, bridge_count')
    .eq('id', post.id)
    .single()
  if (p) {
    const row = p as Record<string, number>
    const upd: Record<string, number> = {}
    for (const r of removed) upd[COUNT_COL[r]] = Math.max(0, row[COUNT_COL[r]] - 1)
    for (const a of added) upd[COUNT_COL[a]] = Math.max(0, row[COUNT_COL[a]] + 1)
    if (isBridge && removed.length > 0) {
      upd.bridge_count = Math.max(0, row.bridge_count - removed.length)
    }
    await supabase.from('posts').update(upd).eq('id', post.id)
  }

  // 글 작성자 누적 카운트
  const { data: au } = await supabase
    .from('users')
    .select('total_stars, total_verified, total_questions')
    .eq('id', post.user_id)
    .single()
  if (au) {
    const row = au as Record<string, number>
    const upd: Record<string, number> = {}
    for (const r of removed) upd[TOTAL_COL[r]] = Math.max(0, row[TOTAL_COL[r]] - 1)
    for (const a of added) upd[TOTAL_COL[a]] = Math.max(0, row[TOTAL_COL[a]] + 1)
    await supabase.from('users').update(upd).eq('id', post.user_id)
  }
}
