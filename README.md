# Itda · 잇다

> **119 신고접수센터의 흩어진 경험을, 모두의 집단지성으로 잇다.**
> 현장에서 얻은 노하우를 자연어 한 줄로 적으면, AI가 제목·요약·태그·카테고리로 구조화해
> 검색하고 나눌 수 있는 팀의 자산으로 바꿔 주는 **모바일 우선 웹 앱**.

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?logo=googlegemini&logoColor=white)

**데모:** _(배포 URL 추가 예정)_

---

## 목차

- [왜 만들었나](#-왜-만들었나)
- [Itda의 세 가지 약속](#-itda의-세-가지-약속)
- [이런 분들을 위해](#-이런-분들을-위해)
- [이 프로젝트가 특별한 이유](#-이-프로젝트가-특별한-이유)
- [핵심 기능](#-핵심-기능)
- [동작 원리](#-동작-원리)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [데이터 모델](#-데이터-모델)
- [설계상의 주요 결정](#-설계상의-주요-결정)

---

## 🔥 왜 만들었나

현장의 진짜 노하우 — *"이런 신고에는 이렇게 되묻는다"*, *"이 장비는 이런 순서로 점검한다"* — 는
대부분 매뉴얼에 없습니다. 개인의 머릿속, 잘해야 옆자리 동료와의 대화에만 남죠.
그래서 **사람이 바뀌면 지식도 함께 사라집니다.**

쌓이는 경험을 글로 남기면 좋지만, 현장은 바쁘고 "정리해서 잘 쓰는 일"은 늘 뒤로 밀립니다.

**Itda는 이 간극을 메우는 도구입니다.** 적는 부담은 사람에게서 덜어 AI에게 맡기고,
사람은 *떠오른 노하우를 자연어로 툭 던지기만* 하면 됩니다. 나머지 — 제목 정리, 요약,
태깅, 분류, 그리고 다른 직군에게 닿게 하는 일 — 은 시스템이 합니다.
흩어진 개인의 암묵지를 **팀 전체의 집단지성**으로 잇는 것, 그게 이 프로젝트의 이름이자 목표입니다.

---

## 💡 Itda의 세 가지 약속

|  적기 쉽게  |  찾기 쉽게  |  잇기 쉽게  |
|:---:|:---:|:---:|
| 자연어 **한 줄**이면 끝 | AI 구조화 + 카테고리 필터 | 검색·추천·**직군 횡단**으로 자동 확산 |
| 입력은 *사람* | 정리는 *AI* | 확산은 *시스템* |

> 입력은 간단하게, 정리는 똑똑하게, 확산은 자동으로.

---

## 🙌 이런 분들을 위해

119 신고접수센터의 **세 직군 직원(약 120명)** 을 위해 만들었습니다.

| 직군 | 하는 일 |
|------|---------|
| **접수** | 신고 전화를 받아 상황을 파악·접수 |
| **관제** | 출동 자원을 배치하고 현장을 관제 |
| **보고** | 상황을 정리하고 보고 |

세 직군은 같은 사건을 **서로 다른 시야**로 봅니다. Itda는 그 서로 다른 시야가
교차하는 **직군 횡단(bridge)** 지식 전파를 특히 중요하게 여깁니다.

---

## ✨ 이 프로젝트가 특별한 이유

> 단순한 게시판이 아니라, **"어떻게 하면 사람들이 경쟁이 아니라 협력으로 지식을 나눌까"**
> 라는 질문에서 출발한 설계입니다.

### 1. 순위가 없는 성장 — 경쟁이 아니라 기여

대부분의 커뮤니티는 포인트·랭킹으로 참여를 유도합니다. Itda는 **의도적으로 리더보드를 두지 않았습니다.**
내 성장 화면이 보여 주는 건 "몇 등"이 아니라 **"N명에게 도움"** — 내 글에 반응한 *고유 사용자 수*입니다.
지식 공유의 동기를 *이기는 것*이 아니라 *돕는 것*에 맞춘, 이 앱의 가장 핵심적인 철학입니다.

### 2. 직군 횡단(bridge) 🔗 — 벽을 넘는 지식

글 작성자와 **다른 직군**의 사람이 반응하면, 그 반응은 자동으로 '브릿지'로 표시됩니다.
접수의 노하우가 관제에게, 관제의 경험이 보고에게 닿는 순간을 **눈에 보이게** 만든 장치죠.
이 판별은 프론트엔드가 아니라 **DB의 `BEFORE INSERT` 트리거**가 직접 수행해,
어디서든 일관되게 집계되고 임의로 조작할 수 없습니다.

### 3. 살아 있는 카테고리 — 고정 분류 대신 AI 유동 분류

카테고리는 미리 정해 둔 고정 목록이 **아닙니다.** 글을 쓸 때마다 AI가 기존 카테고리를
살펴보고, 맞는 게 있으면 재사용하고 없으면 **새 카테고리(2~4자 한국어)** 를 만들어냅니다.
현장의 언어를 그대로 따라 자라나는 분류 체계이며, 갓 생긴 카테고리에는 24시간 동안 `NEW` 뱃지가 붙습니다.

### 4. 협력적 반응 — 평가가 아니라 함께 키우기

반응 문구 하나하나가 "함께 키운다"는 태도를 담았습니다.

| 반응 | 의미 | 뉘앙스 |
|:---:|------|--------|
| ❤️ **유용했어요** | 도움이 되는 인사이트네요 | 고마움 |
| ✅ **나도 검증함** | 현장에서 실제로 적용해 봤어요 | 신뢰 |
| 🌱 **같이 키워봐요** | 아직 검증 전이지만 좋은 아이디어예요 | 협력 |

특히 🌱은 *"아직 완성되지 않은 아이디어도 함께 키우자"* 는 신호입니다.
불완전한 지식도 환영받을 때, 사람들은 더 많이 공유하니까요.

---

## 🧩 핵심 기능

- 🧠 **AI 자동 구조화** — 자연어로 적은 노하우를 Gemini가 제목·요약·태그·카테고리가 있는 구조화된 글로 변환.
- 🏷️ **AI 유동 카테고리** — AI가 기존 카테고리를 재사용하거나 새 카테고리를 생성. 최근 24시간 내 생성 시 `NEW` 뱃지.
- ❤️✅🌱 **협력적 반응** — **❤️ 유용했어요**, **✅ 나도 검증함**, **🌱 같이 키워봐요** 세 가지로 글에 반응.
- 🔗 **직군 횡단(bridge)** — 다른 직군이 반응하면 'bridge'로 자동 표시(DB 트리거가 판별). 직군 간 지식 전파를 가시화.
- 📈 **내 성장** — 순위·경쟁 대신 **"N명에게 도움"** 과 주간 활동 그래프로 기여를 보여 줌.
- 💬 **이번 주 화두 / 공지** — 주간 토론 주제와 운영 공지를 메인에서 바로 확인.
- 🔎 **검색 & 필터** — 키워드 검색과 카테고리·반응 기준 필터로 원하는 노하우를 빠르게 탐색.

---

## ⚙️ 동작 원리

```
[자연어 한 줄 입력]
        │
        ▼
/api/structure  ──►  Google Gemini (gemini-2.5-flash)
 (서버리스 함수,        제목·요약·태그·카테고리(JSON) 생성
  API 키는 서버 보관)   기존 카테고리 목록을 프롬프트에 주입
        │
        ▼
posts.ai_result(JSONB)에 통째 저장 + post_categories 연결
        │
        ▼
[피드 카드]  ──►  반응(낙관적 UI 즉시 반영)
        │              │
        │              └─ 다른 직군이면 트리거가 bridge로 집계 🔗
        ▼
[내 성장]  ◄── "N명에게 도움" · 주간 그래프로 반영
```

> 데모 피드가 비지 않도록, 시드 데이터의 작성 시각은 매일 KST 자정 **Vercel Cron**이
> 갱신해 항상 '오늘' 안에 머무르게 합니다.

---

## 🧰 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 프론트엔드 | React + TypeScript + Tailwind CSS + Vite |
| 백엔드 / DB | Supabase (PostgreSQL) — 테이블·트리거·RPC |
| AI 구조화 | Google Gemini (`gemini-2.5-flash`) — 데모용. 실배포 시 로컬 모델(Ollama) 교체 예정 |
| 배포 | Vercel (서버리스 함수 + Cron) |

> 디자인: 토스(Toss) 스타일 미니멀, 모바일 우선(375px 기준), Pretendard 폰트.

---

## 🗂 프로젝트 구조

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
│  ├─ seed.sql         # 초기 더미 데이터
│  └─ refresh_seed_timestamps.sql  # 시드 시각 갱신 함수 (Cron이 호출)
├─ preview-main-v4.html  # 디자인 레퍼런스(정적 목업)
└─ claude-code-prompt.md # 빌드 스펙(데이터 모델·화면·API·구현 단계)
```

---

## 🚀 시작하기

### 사전 준비
- Node.js · Supabase 프로젝트 · Google Gemini API 키

### 1. 설치
```bash
npm install
```

### 2. 환경 변수
`.env.example`를 복사해 `.env.local`을 만들고 값을 채웁니다. **`.env.local`은 절대 커밋하지 않습니다.**

```bash
VITE_SUPABASE_URL=        # Supabase 프로젝트 URL
VITE_SUPABASE_ANON_KEY=   # Supabase anon key
GEMINI_API_KEY=           # Gemini 키 (VITE_ 접두사 금지 — 서버에서만 사용)
```
> Gemini 키는 브라우저에 노출되면 안 되므로 Vercel 서버리스 함수(`/api/structure`)에서만 사용합니다.
> 배포 시 같은 변수들을 Vercel 환경 변수로 등록하세요.

### 3. 데이터베이스 준비
Supabase SQL 에디터에서 순서대로 실행합니다.
```text
supabase/schema.sql                 # 테이블 + 직군 횡단 감지 트리거
supabase/seed.sql                   # 데모용 더미 데이터
supabase/refresh_seed_timestamps.sql  # (선택) 데모 피드 자동 갱신용 함수
```

### 4. 개발 서버
```bash
npm run dev       # /api/structure 도 Vite 미들웨어가 처리 (Vercel CLI 불필요)
npm run build     # 타입 체크 + 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
```

---

## 🗃 데이터 모델

- **users** — 닉네임, 직군(접수/관제/보고), 누적 반응 카운터
- **posts** — 원문 + `ai_result`(Gemini JSON 통째 저장) + 반응 카운터(`star`/`verified`/`question`/`bridge`)
- **categories** — AI가 만드는 유동 카테고리 (`post_count`로 인기순)
- **post_categories** — 글-카테고리 다대다 연결(분류·집계의 정규화 소스)
- **reactions** — `UNIQUE(post_id, user_id, type)`, `is_bridge`(트리거가 설정)
- **notices / weekly_topics / topic_answers** — 공지·주간 화두·답변

> 자세한 SQL과 AI 프롬프트, 화면 명세는 [`claude-code-prompt.md`](./claude-code-prompt.md) 참고.

---

## 🧭 설계상의 주요 결정

- **순위 없음** — 의도적으로 리더보드를 두지 않고 "도움 준 사람 수"만 보여 줘, 경쟁이 아닌 협력을 유도합니다.
- **직군 횡단 판별은 DB에서** — 프론트가 아니라 `BEFORE INSERT` 트리거가 `is_bridge`를 설정하고 `bridge_count`를 올립니다.
- **낙관적 UI** — 반응은 API 응답을 기다리지 않고 화면에 먼저 반영하고, 실패 시 롤백합니다.
- **MVP는 인증 없음** — 첫 방문 때 이름+직군만 입력하고 `user_id`를 `localStorage`에 보관. Supabase RLS는 MVP에서 비활성화(빠른 개발 우선).
- **AI 키는 서버에서만** — Gemini 호출은 Vercel 서버리스 함수를 거쳐 키가 브라우저에 노출되지 않습니다.
- **모바일 사파리 대응** — 전체 높이에 `100vh` 대신 `100dvh` 사용.
- **데모 데이터 자동 신선화** — 매일 KST 자정 Cron이 시드 타임스탬프를 갱신해 '오늘' 피드가 비지 않게 유지합니다.

---

<p align="center"><em>119 현장의 암묵지를, 모두의 지식으로 잇다.</em></p>
