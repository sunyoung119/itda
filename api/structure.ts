/**
 * /api/structure — 자연어 업무 노하우를 구조화된 JSON 으로 변환하는 서버리스 함수.
 *
 * Gemini API 키(GEMINI_API_KEY)는 이 서버 코드에서만 사용되며 브라우저에 노출되지 않는다.
 * Vercel 배포 시 자동으로 서버리스 함수가 되고, 로컬에서는 vite.config.ts 의
 * devApiPlugin 이 동일 경로로 서빙한다. req/res 는 Node 표준 http 타입만 사용해
 * 두 환경에서 모두 동작한다.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

interface StructureRequest {
  text: string
  role: string
  existingCategories: string[]
}

function buildPrompt({ text, role, existingCategories }: StructureRequest): string {
  const catList = existingCategories.length > 0 ? existingCategories.join(', ') : '(아직 없음)'
  return `당신은 119 신고접수센터의 사내 지식 정리 AI입니다.
직원이 자유롭게 작성한 업무 노하우를 분석하여 구조화된 JSON으로만 답변하세요.

현재 존재하는 카테고리 목록:
[${catList}]

category 규칙:
- 위 목록 중 가장 적합한 것이 있으면 그것을 사용
- 적합한 것이 없으면 2~4글자 한국어 명사로 새 카테고리 생성
- 새로 만들 때는 기존 카테고리와 의미가 겹치지 않도록 주의
- 하나의 글에 1~2개 카테고리 배정
- category_emojis 는 categories 와 같은 개수로, 각 카테고리에 어울리는 이모지 1개씩

출력 형식 (JSON만, 다른 텍스트 없이):
{
  "title": "20자 이내의 명확한 핵심 제목",
  "categories": ["카테고리1", "카테고리2"],
  "category_emojis": ["이모지1", "이모지2"],
  "tags": ["태그1", "태그2", "태그3"],
  "summary": "2-3문장으로 핵심 인사이트 요약"
}

작성자 직군: ${role}
분석할 글:
"""
${text}
"""`
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

/** Vercel 은 req.body 를 미리 파싱해 주고, 로컬(Vite)은 직접 스트림을 읽는다. */
async function readBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  }
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const raw = Buffer.concat(chunks).toString('utf-8')
  return raw ? JSON.parse(raw) : {}
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; method?: string },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'POST 요청만 허용됩니다.' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return sendJson(res, 500, { error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' })
  }

  let body: Partial<StructureRequest>
  try {
    body = (await readBody(req)) as Partial<StructureRequest>
  } catch {
    return sendJson(res, 400, { error: '요청 본문(JSON)을 읽을 수 없습니다.' })
  }

  const text = String(body.text ?? '').trim()
  const role = String(body.role ?? '').trim()
  const existingCategories = Array.isArray(body.existingCategories)
    ? body.existingCategories.map((c) => String(c))
    : []

  if (!text) {
    return sendJson(res, 400, { error: '분석할 글(text)이 비어 있습니다.' })
  }

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt({ text, role, existingCategories }) }] }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
    })

    if (!geminiRes.ok) {
      const detail = await geminiRes.text()
      return sendJson(res, 502, {
        error: `Gemini API 오류 (${geminiRes.status})`,
        detail,
      })
    }

    const data = (await geminiRes.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
    }
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!jsonText) {
      return sendJson(res, 502, { error: 'Gemini 응답에서 결과를 찾을 수 없습니다.' })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return sendJson(res, 502, { error: 'Gemini 응답이 올바른 JSON 형식이 아닙니다.', raw: jsonText })
    }

    const asStringArray = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []

    // ai_result 의 일부 필드만 반환 (is_new_category 는 프론트엔드가 계산)
    return sendJson(res, 200, {
      title: String(parsed.title ?? '제목 없음').trim().slice(0, 40),
      summary: String(parsed.summary ?? '').trim(),
      categories: asStringArray(parsed.categories).slice(0, 2),
      category_emojis: asStringArray(parsed.category_emojis).slice(0, 2),
      tags: asStringArray(parsed.tags).slice(0, 5),
    })
  } catch (err) {
    return sendJson(res, 500, { error: 'AI 구조화 처리 중 오류가 발생했습니다.', detail: String(err) })
  }
}
