/** DB 스키마(supabase/schema.sql)에 대응하는 타입 정의 */

export type Role = '접수' | '관제' | '보고'
export type ReactionType = 'star' | 'verified' | 'question'

/** posts.ai_result JSONB 컬럼 구조 (AI 구조화 결과) */
export interface AiResult {
  title: string
  summary: string
  categories: string[]
  category_emojis: string[]
  tags: string[]
  is_new_category: boolean
}

export interface User {
  id: string
  nickname: string
  role: Role
  created_at: string
  total_stars: number
  total_verified: number
  total_questions: number
}

export interface Post {
  id: string
  user_id: string
  author_role: Role
  original_text: string
  ai_result: AiResult | null
  created_at: string
  star_count: number
  verified_count: number
  question_count: number
  bridge_count: number
}

export interface Category {
  id: string
  name: string
  emoji: string
  post_count: number
  created_at: string
}

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  type: ReactionType
  is_bridge: boolean
  created_at: string
}

export interface Notice {
  id: string
  content: string
  created_by: string | null
  created_at: string
  expires_at: string | null
  is_active: boolean
}

export interface WeeklyTopic {
  id: string
  question: string
  created_by: string | null
  week_start: string
  is_active: boolean
}

export interface TopicAnswer {
  id: string
  topic_id: string
  user_id: string
  content: string
  created_at: string
}

/** 필터 시트 상태 — 카테고리(다중)·직군(다중)·반응타입(단일) */
export interface FilterState {
  /** 카테고리명 목록 (빈 배열 = 전체) */
  categories: string[]
  /** 직군 목록 (빈 배열 = 전체) */
  roles: Role[]
  /** 반응 타입 (단일, 'all' = 전체) */
  reaction: 'all' | ReactionType
}
