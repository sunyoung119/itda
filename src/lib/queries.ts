import { supabase } from './supabase'
import type {
  AiResult,
  Category,
  FilterState,
  Notice,
  Post,
  ReactionType,
  Role,
  User,
  WeeklyTopic,
} from '../types'
import type { StructureResult } from './structure'

/** 필터가 적용되지 않은 기본 상태 */
export const EMPTY_FILTER: FilterState = { categories: [], roles: [], reaction: 'all' }

/** 하나라도 조건이 걸려 있으면 true */
export function isFilterActive(f: FilterState): boolean {
  return f.categories.length > 0 || f.roles.length > 0 || f.reaction !== 'all'
}

/** 이번 주(월요일 00:00) 시작 시각 ISO */
export function weekStartISO(): string {
  const d = new Date()
  const day = d.getDay() // 0=일 ... 6=토
  const diffToMonday = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diffToMonday)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** 오늘 00:00 시작 시각 ISO */
export function todayStartISO(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

// ── 이번 주 화두 ─────────────────────────────────────────────────────
export interface WeeklyTopicWithCount extends WeeklyTopic {
  answer_count: number
}

export async function fetchWeeklyTopic(): Promise<WeeklyTopicWithCount | null> {
  const { data } = await supabase
    .from('weekly_topics')
    .select('*, topic_answers(count)')
    .eq('is_active', true)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  const row = data as WeeklyTopic & { topic_answers: { count: number }[] }
  return { ...row, answer_count: row.topic_answers?.[0]?.count ?? 0 }
}

// ── 공지 ─────────────────────────────────────────────────────────────
export async function fetchNotice(): Promise<Notice | null> {
  const { data } = await supabase
    .from('notices')
    .select('*')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Notice) ?? null
}

// ── 글 목록 (TOP 5 / 오늘 전체 / 필터) ───────────────────────────────
export interface PostWithAuthor extends Post {
  users: { nickname: string } | null
}

const REACTION_COUNT_COL: Record<
  ReactionType,
  'star_count' | 'verified_count' | 'question_count'
> = {
  star: 'star_count',
  verified: 'verified_count',
  question: 'question_count',
}

/** 카테고리명 목록 → 해당 카테고리가 붙은 post id 목록 */
async function postIdsForCategories(names: string[]): Promise<string[]> {
  const { data: cats } = await supabase.from('categories').select('id').in('name', names)
  const catIds = ((cats as { id: string }[]) ?? []).map((c) => c.id)
  if (catIds.length === 0) return []
  const { data: links } = await supabase
    .from('post_categories')
    .select('post_id')
    .in('category_id', catIds)
  return [...new Set(((links as { post_id: string }[]) ?? []).map((l) => l.post_id))]
}

interface PostQuery {
  /** 오늘 작성분으로 제한 */
  today: boolean
  orderBy: 'star_count' | 'created_at'
  limit?: number
  filter?: FilterState
}

/** posts 조회 공통 빌더 — 필터(카테고리/직군/반응)를 조합한다 */
async function queryPosts({ today, orderBy, limit, filter }: PostQuery): Promise<PostWithAuthor[]> {
  // 카테고리 필터는 post_categories 를 거쳐 post id 로 먼저 환산한다
  let categoryPostIds: string[] | null = null
  if (filter && filter.categories.length > 0) {
    categoryPostIds = await postIdsForCategories(filter.categories)
    if (categoryPostIds.length === 0) return [] // 매칭 글 없음
  }

  let q = supabase.from('posts').select('*, users(nickname)')
  if (today) q = q.gte('created_at', todayStartISO())
  if (categoryPostIds) q = q.in('id', categoryPostIds)
  if (filter && filter.roles.length > 0) q = q.in('author_role', filter.roles)
  if (filter && filter.reaction !== 'all') {
    q = q.gt(REACTION_COUNT_COL[filter.reaction], 0)
  }

  const ordered = q.order(orderBy, { ascending: false })
  const { data } = await (limit ? ordered.limit(limit) : ordered)
  return (data as PostWithAuthor[]) ?? []
}

/** [3] TOP 5 — 오늘 작성, 별점 순 (필터 반영) */
export function fetchTopPosts(filter?: FilterState): Promise<PostWithAuthor[]> {
  return queryPosts({ today: true, orderBy: 'star_count', limit: 5, filter })
}

/** 사이드바 — 오늘 작성 글 전체, 시간 역순 (필터 반영) */
export function fetchTodayPosts(filter?: FilterState): Promise<PostWithAuthor[]> {
  return queryPosts({ today: true, orderBy: 'created_at', filter })
}

// ── 카테고리 상위 8개 ────────────────────────────────────────────────
export async function fetchTopCategories(limit = 8): Promise<Category[]> {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(limit)
  return (data as Category[]) ?? []
}

/** 이름으로 카테고리 조회 (글 상세의 NEW 뱃지 판정용) */
export async function fetchCategoriesByName(names: string[]): Promise<Category[]> {
  if (names.length === 0) return []
  const { data } = await supabase.from('categories').select('*').in('name', names)
  return (data as Category[]) ?? []
}

// ── 내 성장 (이번 주) ────────────────────────────────────────────────
export interface GrowthStats {
  postCount: number
  stars: number
  bridges: number
  questions: number
  /** 받은 반응의 고유 사용자 수 */
  helpedCount: number
  /** 월~일 7일간 일별 작성 글 수 */
  weekBars: number[]
}

export async function fetchGrowth(userId: string): Promise<GrowthStats> {
  const weekStart = weekStartISO()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, created_at, star_count, bridge_count, question_count')
    .eq('user_id', userId)
    .gte('created_at', weekStart)

  const rows = (posts ?? []) as Pick<
    Post,
    'id' | 'created_at' | 'star_count' | 'bridge_count' | 'question_count'
  >[]

  const weekBars = [0, 0, 0, 0, 0, 0, 0] // 월=0 ... 일=6
  let stars = 0
  let bridges = 0
  let questions = 0
  for (const p of rows) {
    stars += p.star_count
    bridges += p.bridge_count
    questions += p.question_count
    const dayIdx = (new Date(p.created_at).getDay() + 6) % 7
    weekBars[dayIdx] += 1
  }

  let helpedCount = 0
  if (rows.length > 0) {
    const { data: reactions } = await supabase
      .from('reactions')
      .select('user_id')
      .in(
        'post_id',
        rows.map((p) => p.id),
      )
      .gte('created_at', weekStart)
    helpedCount = new Set((reactions ?? []).map((r) => r.user_id as string)).size
  }

  return { postCount: rows.length, stars, bridges, questions, helpedCount, weekBars }
}

// ── 글 작성 시 카테고리 목록 (AI 프롬프트용) ─────────────────────────
export async function fetchCategoryNames(): Promise<string[]> {
  const { data } = await supabase
    .from('categories')
    .select('name')
    .order('post_count', { ascending: false })
  return ((data as { name: string }[]) ?? []).map((c) => c.name)
}

export const ROLE_LIST: Role[] = ['접수', '관제', '보고']

// ── 글 등록 (AI 결과 → 카테고리 처리 + posts/post_categories INSERT) ──
export async function createPost(
  user: User,
  originalText: string,
  structured: StructureResult,
): Promise<void> {
  // 1. 기존 카테고리 조회 (이름 → { id, post_count })
  const { data: existingRows } = await supabase
    .from('categories')
    .select('id, name, post_count')
  const known = new Map<string, { id: string; post_count: number }>(
    ((existingRows ?? []) as { id: string; name: string; post_count: number }[]).map((c) => [
      c.name,
      { id: c.id, post_count: c.post_count },
    ]),
  )

  // 2. AI 카테고리 순회 — 기존이면 post_count +1, 없으면 새 카테고리 생성
  const categoryIds: string[] = []
  let anyNew = false
  for (let i = 0; i < structured.categories.length; i++) {
    const name = structured.categories[i]?.trim()
    if (!name) continue
    const emoji = structured.category_emojis[i]?.trim() || '📋'
    const hit = known.get(name)
    if (hit) {
      await supabase
        .from('categories')
        .update({ post_count: hit.post_count + 1 })
        .eq('id', hit.id)
      hit.post_count += 1
      categoryIds.push(hit.id)
    } else {
      const { data: created } = await supabase
        .from('categories')
        .insert({ name, emoji, post_count: 1 })
        .select('id')
        .single()
      if (created) {
        const id = (created as { id: string }).id
        known.set(name, { id, post_count: 1 })
        categoryIds.push(id)
        anyNew = true
      }
    }
  }

  // 3. posts INSERT — ai_result 를 JSONB 로 통째 저장
  const aiResult: AiResult = {
    title: structured.title,
    summary: structured.summary,
    categories: structured.categories,
    category_emojis: structured.category_emojis,
    tags: structured.tags,
    is_new_category: anyNew,
  }
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      author_role: user.role,
      original_text: originalText,
      ai_result: aiResult,
    })
    .select('id')
    .single()
  if (postError || !post) {
    throw new Error('글 저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
  }

  // 4. post_categories 연결 (중복 카테고리 제거)
  const uniqueIds = [...new Set(categoryIds)]
  if (uniqueIds.length > 0) {
    await supabase
      .from('post_categories')
      .insert(uniqueIds.map((cid) => ({ post_id: (post as { id: string }).id, category_id: cid })))
  }
}
