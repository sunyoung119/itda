-- ════════════════════════════════════════════════════════════════════
--  Itda — 데이터베이스 스키마
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 실행한다.
--  (claude-code-prompt.md 의 테이블 정의를 그대로 따른다)
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── users (사용자) ──────────────────────────────────────────────────
create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  nickname        text not null,
  role            text not null check (role in ('접수', '관제', '보고')),
  created_at      timestamptz default now(),
  total_stars     integer default 0,
  total_verified  integer default 0,
  total_questions integer default 0
);

-- ── posts (암묵지 글) ───────────────────────────────────────────────
create table if not exists posts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) not null,
  author_role     text not null,
  original_text   text not null,
  ai_result       jsonb,
  created_at      timestamptz default now(),
  star_count      integer default 0,
  verified_count  integer default 0,
  question_count  integer default 0,
  bridge_count    integer default 0
);

create index if not exists idx_posts_created on posts(created_at desc);
create index if not exists idx_posts_stars   on posts(star_count desc);

-- ── categories (유동 카테고리) ──────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  emoji       text default '📋',
  post_count  integer default 0,
  created_at  timestamptz default now()
);

create index if not exists idx_categories_count on categories(post_count desc);

-- ── post_categories (글-카테고리 연결, 다대다) ──────────────────────
create table if not exists post_categories (
  post_id     uuid references posts(id) on delete cascade,
  category_id uuid references categories(id),
  primary key (post_id, category_id)
);

-- ── reactions (반응) ────────────────────────────────────────────────
create table if not exists reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid references posts(id) on delete cascade,
  user_id     uuid references users(id) not null,
  type        text not null check (type in ('star', 'verified', 'question')),
  is_bridge   boolean default false,
  created_at  timestamptz default now(),
  unique (post_id, user_id, type)
);

create index if not exists idx_reactions_post on reactions(post_id);

-- ── notices (공지사항) ──────────────────────────────────────────────
create table if not exists notices (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  created_by  uuid references users(id),
  created_at  timestamptz default now(),
  expires_at  timestamptz,
  is_active   boolean default true
);

-- ── weekly_topics (이번 주 화두) ────────────────────────────────────
create table if not exists weekly_topics (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  created_by  uuid references users(id),
  week_start  date not null,
  is_active   boolean default true
);

-- ── topic_answers (화두 답변) ───────────────────────────────────────
create table if not exists topic_answers (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid references weekly_topics(id) on delete cascade,
  user_id     uuid references users(id) not null,
  content     text not null,
  created_at  timestamptz default now()
);

-- ── 직군 횡단(bridge) 자동 감지 트리거 ──────────────────────────────
-- 반응한 사용자의 직군이 글 작성자 직군과 다르면 is_bridge = true,
-- 동시에 posts.bridge_count 를 1 증가시킨다.
create or replace function check_bridge_reaction()
returns trigger as $$
begin
  if (select role from users where id = new.user_id)
     != (select author_role from posts where id = new.post_id)
  then
    new.is_bridge := true;
    update posts set bridge_count = bridge_count + 1
    where id = new.post_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bridge_check on reactions;
create trigger trg_bridge_check
  before insert on reactions
  for each row execute function check_bridge_reaction();

-- ── MVP: RLS 비활성화 (빠른 개발 우선, claude-code-prompt.md 주의사항) ─
alter table users           disable row level security;
alter table posts           disable row level security;
alter table categories      disable row level security;
alter table post_categories disable row level security;
alter table reactions       disable row level security;
alter table notices         disable row level security;
alter table weekly_topics   disable row level security;
alter table topic_answers   disable row level security;
