import type { Role } from '../types'

/** /api/structure 가 반환하는 AI 구조화 결과 (is_new_category 제외) */
export interface StructureResult {
  title: string
  summary: string
  categories: string[]
  category_emojis: string[]
  tags: string[]
}

/** 자연어 텍스트를 서버리스 함수(/api/structure)로 보내 구조화 결과를 받는다. */
export async function structureText(
  text: string,
  role: Role,
  existingCategories: string[],
): Promise<StructureResult> {
  const res = await fetch('/api/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, role, existingCategories }),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `AI 구조화에 실패했어요 (${res.status})`)
  }
  return (await res.json()) as StructureResult
}
