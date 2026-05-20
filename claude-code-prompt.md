# Itda
 — 119 신고접수센터 암묵지 공유 플랫폼

## 프로젝트 개요
119 신고접수센터 직원(접수/관제/보고요원, 총 120명)이 업무 중 얻은 암묵지를 자연어로 입력하면, AI가 자동 구조화하여 모으는 모바일 우선 웹 앱.

## 기술 스택
- **프론트엔드**: React + TypeScript + Tailwind CSS + Vite
- **AI 구조화**: Google Gemini API (gemini-2.5-flash) — 데모용. 실배포 시 로컬 모델(Ollama)로 교체 예정
- **데이터베이스**: PostgreSQL (Supabase 호스팅)
- **인증**: 1차 MVP는 인증 없이 누구나 접근 (첫 방문 시 이름+직군 입력, localStorage로 식별)
- **배포**: Vercel
- **버전관리**: GitHub

## 디자인 시스템

### 컬러 토큰 (Tailwind config에 반영)
```
coral: #FF6B6B (primary)
coral-soft: #FFE5E5
coral-dark: #E84B4B
yellow: #FFD93D (star)
yellow-soft: #FFF5CC
green: #4ADE80 (verified)
green-soft: #DCFCE7
blue: #60A5FA (question)
blue-soft: #DBEAFE
purple: #A78BFA (bridge - 직군 횡단)
purple-soft: #EDE9FE
bg: #FAFAF7
card: #FFFFFF
ink: #1A1A1A
ink-soft: #4A4A4A
ink-muted: #8E8E8E
border: #EDEDE8
```

### 폰트

 (CDN: https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css)

### 디자인 원칙
- 토스(Toss) 스타일 미니멀
- 둥근 모서리 일관 (카드 16px, 칩 8px, 버튼 12px)
- 부드러운 그림자
- 모바일 우선 (375px 기준, 반응형)
- 디자인 레퍼런스: 함께 첨부한 preview-main-v4.html 파일의 디자인을 최대한 따를 것

## 데이터베이스 (Supabase PostgreSQL)

### 테이블 구조

#### users (사용자)
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname        TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('접수', '관제', '보고')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  total_stars     INTEGER DEFAULT 0,
  total_verified  INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0
);
```

#### posts (암묵지 글)
```sql
CREATE TABLE posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  author_role     TEXT NOT NULL,
  original_text   TEXT NOT NULL,
  ai_result       JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  star_count      INTEGER DEFAULT 0,
  verified_count  INTEGER DEFAULT 0,
  question_count  INTEGER DEFAULT 0,
  bridge_count    INTEGER DEFAULT 0
);

CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_stars ON posts(star_count DESC);
```

ai_result JSONB 컬럼 구조 예시:
```json
{
  "title": "정신질환 신고 시 위치 특정 화법",
  "summary": "주변에 뭐가 보이세요 라고 물으면 위치 특정이 빠르다",
  "categories": ["위치특정", "정신질환"],
  "category_emojis": ["📞", "🧠"],
  "tags": ["위치특정", "정신질환", "접수팁"],
  "is_new_category": true
}
```

#### categories (유동 카테고리)
```sql
CREATE TABLE categories (
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name        TEXT UNIQUE NOT NULL,
emoji       TEXT DEFAULT '📋',
post_count  INTEGER DEFAULT 0,
created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_count ON categories(post_count DESC);
```

#### post_categories (글-카테고리 연결, 다대다)
```sql
CREATE TABLE post_categories (
post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
category_id UUID REFERENCES categories(id),
PRIMARY KEY (post_id, category_id)
);
```

#### reactions (반응)
```sql
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('star', 'verified', 'question')),
  is_bridge   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id, type)
);

CREATE INDEX idx_reactions_post ON reactions(post_id);
```

#### notices (공지사항)
```sql
CREATE TABLE notices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT true
);
```

#### weekly_topics (이번 주 화두)
```sql
CREATE TABLE weekly_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  created_by  UUID REFERENCES users(id),
  week_start  DATE NOT NULL,
  is_active   BOOLEAN DEFAULT true
);
```

#### topic_answers (화두 답변)
```sql
CREATE TABLE topic_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    UUID REFERENCES weekly_topics(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### DB 트리거: 직군 횡단 자동 감지
```sql
CREATE OR REPLACE FUNCTION check_bridge_reaction()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.user_id)
     != (SELECT author_role FROM posts WHERE id = NEW.post_id)
  THEN
    NEW.is_bridge := true;
    UPDATE posts SET bridge_count = bridge_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bridge_check
BEFORE INSERT ON reactions
FOR EACH ROW EXECUTE FUNCTION check_bridge_reaction();
```

### 반응 무결성 규칙
- 한 사용자가 한 글에 동일 reaction_type 중복 불가 (UNIQUE 제약)
- ⭐ + ✅ 동시 가능 (둘은 양립)
- ❓ 누르면 ⭐는 자동 해제 (프론트엔드에서 처리: ❓ INSERT 전에 star DELETE)
- 반응 시 posts 테이블의 카운트 컬럼 동시 업데이트

## 화면 구조

### 메인 화면 (모바일 세로, 상하 50:50 분할)

#### 상단 헤더 (sticky)
- 좌측: ☰ 사이드바 트리거 (우측에서 슬라이드)
- 중앙: 로고 (코랄 둥근사각형 💡) + "팀지식인"
- 우측: ⚲ 필터 아이콘 + 프로필 아바타

#### 상단 50% (스크롤 가능)

**[1] 이번 주 화두 (코랄 풀너비 배너)**
- 좌: 💡 아이콘
- 중: "이번 주 화두" 라벨 + 질문 텍스트
- 우: 답변 수 카운트
- 탭하면 답변 목록/입력 화면으로 이동

**[2] 공지사항 (1줄 축소 카드)**
- 📌 아이콘 + 공지 텍스트 + 시간
- 노란색 그라데이션 배경

**[3] "🔥 오늘 가장 빛난 지혜" (목록형 5줄)**
- 각 항목: 순위번호 + AI제목(1줄 ellipsis) + 직군뱃지 + 반응카운트
- 상위 3개 순위번호는 코랄색
- 직군 횡단 반응 있으면 🌉 표시 (퍼플)
- 반응은 줄 끝에 표시: ⭐24 🌉 ✅9 ❓2

**[4] "📚 카테고리" + "AI 자동 분류" 뱃지 (4×2 그리드)**
- AI가 유동적으로 생성한 카테고리, post_count 높은 순 상위 8개
- 각 카드: 이모지 + 카테고리명 + 글 수
- 최근 생성된 카테고리에 NEW 뱃지 (코랄 보더 + 빨간 NEW 태그)
- "전체 ›" 링크

#### 하단 50% (고정, 시각적으로 구분)

**[5] 내 성장 미니 그래프**
- 좌: 주간 바차트 (7일, 오늘은 깜빡이는 애니메이션)
- 중: "김지식 님의 이번 주" + 작성 5 · ⭐ 32 · 🌉 3 · ❓ 1
- 우: 초록 박스 "14명 / 에게 도움" (받은 반응의 고유 사용자 수)
- 순위 표시 없음 (경쟁 조장 방지)

**[6] 자연어 입력**
- "💭 떠오른 생각을 적어주세요" + "AI 자동 정리" 뱃지
- textarea (placeholder: 119 도메인에 맞는 예시)
- 하단: AI 힌트 + 등록하기 버튼

### 사이드바 (우측 슬라이드)
- "오늘의 지혜" 헤더 + 날짜 + 개수
- 오늘 올라온 글 전체 (시간 역순)
- 각 항목: 작성자/직군/시각/AI제목/반응카운트

### 필터 시트 (하단 슬라이드)
- 필터 아이콘 클릭 시 열림
- 3개 섹션 (칩 형태):
  - 카테고리 (다중 선택) — DB의 categories 테이블에서 동적 로드
  - 직군 (다중): 전체/접수/관제/보고
  - 반응 타입 (단일): 전체/⭐/✅/❓
- 하단: 초기화 + 적용하기

### 반응 선택 시트 (하단 슬라이드)
- 카드 반응 카운트 영역 탭 시 열림
- 3개 큰 버튼 (수직):
  - ⭐ 유용했어요 / "도움이 되는 인사이트네요" / 현재 N명
  - ✅ 나도 검증함 / "현장에서 실제로 적용해봤어요" / 현재 N명
  - ❓ 상황 다름 / "내 케이스에선 다른 결과였어요" / 현재 N명

### 글 상세 화면 (카드 클릭 시)
- AI 제목 (큼직)
- 작성자 + 직군뱃지 + 시각
- AI 카테고리 태그 (NEW 표시 포함) + AI 태그
- AI 요약
- 원문 (인용 박스, 좌측 코랄 보더)
- 큰 반응 버튼 영역
- 직군 횡단 🌉 표시

### 초기 진입 모달 (첫 방문 시)
- 이름 입력
- 직군 선택 (접수/관제/보고 — 큰 카드 3개)
- "시작하기" 버튼
- localStorage에 user_id 저장

## 핵심 기능 흐름

### 1. 글 등록 (AI 유동 카테고리 포함)

```
사용자 자연어 입력 → "등록하기" 클릭
  ↓
처리 중 애니메이션 (3단계: 분석 중 → 분류 중 → 요약 생성 중)
  ↓
[1] Supabase에서 기존 카테고리 목록 조회
    SELECT name FROM categories ORDER BY post_count DESC;
  ↓
[2] Gemini API 호출 (기존 카테고리 목록을 프롬프트에 포함)
  ↓
[3] JSON 응답 파싱
  ↓
[4] 카테고리 처리:
    - 응답의 categories 배열 순회
    - 기존 categories 테이블에 있으면 → post_count +1
    - 없으면 → INSERT (새 카테고리 생성), is_new_category = true
    - post_categories 연결 테이블에 INSERT
  ↓
[5] posts 테이블에 INSERT (ai_result는 JSONB로 통째 저장)
  ↓
[6] 피드 최상단에 새 글 표시 (NEW 뱃지)
```

### Gemini API 호출 명세
- 모델: gemini-2.5-flash
- 엔드포인트: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
- 인증: API 키 (환경변수 VITE_GEMINI_API_KEY)
- generationConfig: { temperature: 0.3, responseMimeType: "application/json" }

프롬프트 템플릿:
```
당신은 119 신고접수센터의 사내 지식 정리 AI입니다.
직원이 자유롭게 작성한 업무 노하우를 분석하여 구조화된 JSON으로만 답변하세요.

현재 존재하는 카테고리 목록:
[{existing_categories}]

category 규칙:
- 위 목록 중 가장 적합한 것이 있으면 그것을 사용
- 적합한 것이 없으면 2~4글자 한국어 명사로 새 카테고리 생성
- 새로 만들 때는 기존 카테고리와 의미가 겹치지 않도록 주의
- 하나의 글에 1~2개 카테고리 배정

출력 형식 (JSON만, 다른 텍스트 없이):
{
  "title": "20자 이내의 명확한 핵심 제목",
  "categories": ["카테고리1", "카테고리2"],
  "category_emojis": ["이모지1", "이모지2"],
  "tags": ["태그1", "태그2", "태그3"],
  "summary": "2-3문장으로 핵심 인사이트 요약"
}

작성자 직군: {role}
분석할 글:
"""
{user_text}
"""
```

### 2. 반응 누르기

```
카드 반응 영역 탭 → 반응 선택 시트 열림 → ⭐/✅/❓ 선택
  ↓
프론트엔드 처리:
  - ❓ 선택 시: 기존 star 반응 있으면 DELETE 먼저
  - 이미 같은 반응 있으면 DELETE (토글)
  ↓
Supabase reactions 테이블 INSERT (또는 DELETE)
  → DB 트리거가 자동으로 is_bridge 판별 + bridge_count 업데이트
  ↓
posts 테이블 카운트 업데이트 (+1 또는 -1)
  ↓
UI 낙관적 업데이트 (API 응답 전에 먼저 반영)
```

### 3. 필터 적용

```
필터 아이콘 탭 → 필터 시트 열림
  ↓
카테고리(다중) + 직군(다중) + 반응타입(단일) 선택
  ↓
"적용하기" 클릭
  ↓
Supabase 쿼리 조합:
  - 카테고리 필터: post_categories JOIN
  - 직군 필터: posts.author_role IN (...)
  - 반응 필터: star_count > 0 / verified_count > 0 / question_count > 0
  ↓
결과로 피드 + 사이드바 렌더링
```

### 4. 메인 화면 데이터 로드

```
[TOP 5]
SELECT p.*, u.nickname FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.created_at >= CURRENT_DATE
ORDER BY p.star_count DESC LIMIT 5;

[카테고리 상위 8개]
SELECT name, emoji, post_count, created_at FROM categories
ORDER BY post_count DESC LIMIT 8;
→ created_at이 24시간 이내면 NEW 뱃지 표시

[내 성장]
SELECT
  COUNT(*) as posts_this_week,
  COALESCE(SUM(star_count),0) as stars,
  COALESCE(SUM(bridge_count),0) as bridges,
  COALESCE(SUM(question_count),0) as questions
FROM posts
WHERE user_id = '{my_id}'
  AND created_at >= date_trunc('week', now());

[도움 횟수]
SELECT COUNT(DISTINCT user_id) as helped_count
FROM reactions
WHERE post_id IN (SELECT id FROM posts WHERE user_id = '{my_id}')
  AND created_at >= date_trunc('week', now());

[주간 바차트 데이터]
SELECT DATE(created_at) as day, COUNT(*) as count
FROM posts
WHERE user_id = '{my_id}'
  AND created_at >= date_trunc('week', now())
GROUP BY DATE(created_at)
ORDER BY day;

[공지]
SELECT * FROM notices
WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY created_at DESC LIMIT 1;

[이번 주 화두]
SELECT wt.*, COUNT(ta.id) as answer_count
FROM weekly_topics wt
LEFT JOIN topic_answers ta ON wt.id = ta.topic_id
WHERE wt.is_active = true
GROUP BY wt.id
ORDER BY wt.week_start DESC LIMIT 1;
```

## 환경변수
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

## 구현 우선순위

### Phase 1 (필수 — 오늘 완성)
1. 프로젝트 셋업 (Vite + React + TS + Tailwind)
2. 디자인 시스템 (컬러, 폰트, 토큰)
3. Supabase 연결 + 테이블 생성 (위 SQL 실행)
4. 초기 진입 모달 (이름 + 직군 선택)
5. 메인 화면 레이아웃 (상하 50:50)
6. 이번 주 화두 배너 (읽기 전용)
7. 공지사항 (읽기 전용)
8. 글 작성 → Gemini API 호출 → AI 유동 카테고리 처리 → DB 저장
9. TOP 5 목록 (오늘 기준, star_count 순)
10. 카테고리 그리드 (동적 로드, 상위 8개, NEW 뱃지)
11. 내 성장 그래프 (주간 바차트 + 도움 횟수)
12. GitHub push + Vercel 배포

### Phase 2 (시간 남으면)
13. 사이드바 (오늘의 글 전체 리스트)
14. 필터 시트 (카테고리/직군/반응타입)
15. 반응 선택 시트 (⭐/✅/❓)
16. 직군 횡단 🌉 표시
17. 글 상세 화면

### Phase 3 (후순위)
18. 이번 주 화두 답변 기능
19. 공지사항 관리 (작성/만료)
20. 이번 주 영웅 화면
21. ❓ 코멘트 받기
22. 카카오 로그인
23. 개인정보 자동 마스킹

## 초기 더미 데이터

Supabase에 아래 더미 데이터를 미리 INSERT해서 데모가 빈 화면이 아니게 할 것:

users 3명 (접수/관제/보고 각 1명)
posts 10개 (119 도메인에 맞는 실제적인 암묵지 내용)
categories 6~8개 (위치특정, 심정지대응, 정신질환, 민원응대, 교통사고, 보고서작성 등)
reactions 적절히 분배 (bridge 포함)
notices 1개
weekly_topics 1개

더미 데이터의 글 내용은 119 신고접수 업무에 실제로 도움이 될 만한 내용으로 작성할 것.

## 주의사항
- Supabase RLS(Row Level Security)는 MVP에서 일단 비활성화. 빠른 개발 우선.
- 모바일 사파리 100vh 이슈 → 100dvh 사용
- Gemini API 키는 .env.local에 두고 절대 커밋 금지. Vercel 환경변수로 등록.
- 낙관적 업데이트: 반응 클릭 시 API 응답 전에 UI 먼저 반영
- 카테고리가 100개 넘어가는 것은 현실적으로 안 일어남 (30~50개에서 안정). 프롬프트 토큰 걱정 불필요.

## 시작 지시
1. Phase 1을 순서대로 구현해줘.
2. 먼저 Supabase에 테이블을 생성하는 SQL 마이그레이션 파일을 만들어줘.
3. 그 다음 React 프로젝트를 셋업하고, 디자인 레퍼런스(preview-main-v4.html)를 참고해서 UI를 만들어줘.
4. 각 단계 완료 시 어떤 파일을 만들었고 어떤 부분이 작동하는지 알려줘.
5. 막히는 부분은 질문해줘. 추측해서 진행하지 마.
