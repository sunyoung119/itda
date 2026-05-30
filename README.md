# Itda (잇다) — 119 신고접수센터 암묵지 공유 플랫폼

> 119 신고접수센터 직원이 업무 중 얻은 **암묵지(tacit knowledge)** 를 자연어로 입력하면,
> AI가 제목·요약·태그·카테고리로 **자동 구조화**해 함께 모으고 나누는 모바일 우선 웹 앱.

현장에서 쌓이는 경험과 노하우는 대부분 개인의 머릿속에만 남는다. Itda는 그 지식을
"적기 쉽게(자연어 한 줄)" 만들고, "찾기 쉽게(AI 구조화·분류)" 만들어 팀 전체의 자산으로 잇는다.

**데모:** _(배포 URL 추가 예정)_

---

## 누구를 위한 것인가

119 신고접수센터의 세 직군 직원(약 120명)을 대상으로 한다.

| 직군 | 역할 |
|------|------|
| **접수** | 신고 전화를 받아 상황을 파악·접수 |
| **관제** | 출동 자원을 배치하고 현장을 관제 |
| **보고** | 상황을 정리하고 보고 |

직군이 다른 동료의 노하우를 주고받는 **직군 횡단(bridge)** 지식 전파를 특히 중요하게 본다.

## 핵심 기능

- 🧠 **AI 자동 구조화** — 자연어로 적은 노하우를 Gemini가 제목·요약·태그·카테고리가 있는 구조화된 글로 변환.
- 🏷️ **AI 유동 카테고리** — 카테고리는 고정 목록이 아니다. AI가 기존 카테고리를 재사용하거나, 맞는 게 없으면 새 카테고리(2~4자 한국어)를 만들어낸다. 최근 24시간 내 생성된 카테고리엔 `NEW` 뱃지.
- ❤️✅🌱 **반응** — 글에 세 가지 반응을 남긴다: **❤️ 유용했어요**, **✅ 나도 검증함**, **🌱 같이 키워봐요**.
- 🔗 **직군 횡단(bridge)** — 글 작성자와 다른 직군의 사람이 반응하면 "bridge"로 표시된다. 직군 간 지식 전파를 가시화한다(DB 트리거가 자동 판별).
- 📈 **내 성장** — 순위·경쟁 대신 **"N명에게 도움"**(내 글에 반응한 고유 사용자 수)을 보여줘 협력 문화를 지향한다.
- 💬 **이번 주 화두 / 공지** — 주간 토론 주제와 공지를 메인에서 확인.

## 기술 스택

| 구분 | 사용 기술 |
|------|----------|
| 프론트엔드 | React + TypeScript + Tailwind CSS + Vite |
| 백엔드/DB | Supabase (PostgreSQL) |
| AI 구조화 | Google Gemini (`gemini-2.5-flash`) — 데모용. 실배포 시 로컬 모델(Ollama) 교체 예정 |
| 배포 | Vercel (서버리스 함수 + Cron) |

> 디자인: 토스(Toss) 스타일 미니멀, 모바일 우선(375px 기준), Pretendard 폰트.

## 프로젝트 구조

```
itda/
├─ src/
│  ├─ components/      # 화면 컴포넌트 (Compose, TopList, PostDetail, ReactionSheet 등)
│  ├─ hooks/           # useCurrentUser 등
│  ├─ lib/             # supabase 클라이언트, 쿼리, 반응 로직, 유틸
│  ├─ App.tsx          # 앱 셸 (메인 화면, 상하 50:50 레이아웃)
│  └─ types.ts         # DB 스키마 대응 타입
├─ api/                # Vercel 서버리스 함수
│  ├─ structure.ts     #   Gemini 호출 (/api/structure) — 키를 서버에 보관
│  └─ reseed.ts        #   더미 데이터 리시드 (Cron)
├─ supabase/
│  ├─ schema.sql       # 테이블·트리거 정의
│  └─ seed.sql         # 초기 더미 데이터
├─ preview-main-v4.html  # 디자인 레퍼런스(정적 목업)
└─ claude-code-prompt.md # 빌드 스펙(데이터 모델·화면·API·구현 단계)
```

## 시작하기

### 사전 준비
- Node.js, Supabase 프로젝트, Google Gemini API 키

### 1. 설치
```bash
npm install
```

### 2. 환경 변수
`.env.example`를 복사해 `.env.local`을 만들고 값을 채운다. **`.env.local`은 절대 커밋하지 않는다.**
```bash
VITE_SUPABASE_URL=        # Supabase 프로젝트 URL
VITE_SUPABASE_ANON_KEY=   # Supabase anon key
GEMINI_API_KEY=           # Gemini 키 (VITE_ 접두사 금지 — 서버에서만 사용)
```
> Gemini 키는 브라우저에 노출되면 안 되므로 Vercel 서버리스 함수(`/api/structure`)에서만 쓴다.
> 배포 시 같은 변수들을 Vercel 환경 변수로 등록한다.

### 3. 데이터베이스 준비
Supabase SQL 에디터에서 순서대로 실행한다.
```text
supabase/schema.sql   # 테이블 + 직군 횡단 감지 트리거
supabase/seed.sql     # 데모용 더미 데이터
```

### 4. 개발 서버
```bash
npm run dev       # 로컬에서 /api/structure 도 Vite 미들웨어가 처리 (Vercel CLI 불필요)
npm run build     # 타입 체크 + 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
```

## 데이터 모델 (요약)

- **users** — 닉네임, 직군(접수/관제/보고), 누적 반응 카운터
- **posts** — 원문 + `ai_result`(Gemini JSON 통째 저장) + 반응 카운터(star/verified/question/bridge)
- **categories** — AI가 만드는 유동 카테고리 (`post_count`로 인기순)
- **post_categories** — 글-카테고리 다대다 연결(분류·집계의 정규화 소스)
- **reactions** — `UNIQUE(post_id, user_id, type)`, `is_bridge`(트리거가 설정)
- **notices / weekly_topics / topic_answers** — 공지·주간 화두·답변

자세한 SQL과 AI 프롬프트, 화면 명세는 [`claude-code-prompt.md`](./claude-code-prompt.md) 참고.

## 설계상의 주요 결정

- **MVP는 인증 없음** — 첫 방문 시 이름+직군만 입력하고 `user_id`를 `localStorage`에 보관. Supabase RLS는 MVP에서 비활성화(빠른 개발 우선).
- **순위 없음** — 의도적으로 리더보드를 두지 않고 "도움 준 사람 수"만 보여줘 경쟁이 아닌 협력을 유도.
- **낙관적 UI** — 반응은 API 응답 전에 화면에 먼저 반영.
- **직군 횡단 판별은 DB에서** — 프론트가 아니라 `BEFORE INSERT` 트리거가 `is_bridge`를 설정하고 `bridge_count`를 증가.
- **모바일 사파리 대응** — 전체 높이에 `100vh` 대신 `100dvh` 사용.

---

_119 현장의 암묵지를, 모두의 지식으로 잇다._
