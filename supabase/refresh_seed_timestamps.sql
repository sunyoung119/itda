-- ════════════════════════════════════════════════════════════════════
--  Itda — 시드 데이터 timestamp 갱신 함수
--
--  Supabase SQL Editor 에서 1회 실행하여 함수를 생성/갱신한다.
--  이후 Vercel Cron(매일 KST 00:00)이 /api/reseed 를 호출하면
--  이 함수가 실행되어 seed 의 UUID 에 해당하는 행만 timestamp 가
--  'KST 기준 오늘' 안으로 다시 고정된다.
--
--  ⚠ 운영 중 추가된 사용자/글/카테고리/공지는 ID 가 다르므로
--    이 함수의 영향을 받지 않는다. (id 정확 매칭으로 update 만 수행)
--
--  ── 타임존 설계 ──────────────────────────────────────────────────
--  앱의 '오늘' 필터(queries.ts todayStartISO)는 브라우저 로컬(KST)
--  자정 기준이다. now() 상대 계산은 cron 이 KST 자정에 돌 때 결과가
--  '어제'로 밀려 화면에서 사라진다. 그래서 모든 시드 시각을
--  kst_midnight(= KST 기준 오늘 00:00 의 절대 시각) 기준 절대값으로
--  고정한다. cron 발동 시각과 무관하게 항상 '오늘' 안에 들어간다.
-- ════════════════════════════════════════════════════════════════════

create or replace function refresh_seed_timestamps() returns void
language plpgsql
as $$
declare
  -- KST 기준 '오늘 00:00' 의 절대 시각(timestamptz).
  -- now()(utc) → KST wall-clock → 일 단위 truncate → 다시 KST 로 해석.
  kst_midnight timestamptz :=
    date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
begin
  -- ── categories ───────────────────────────────────────────────────
  -- 앞 6개는 오래된 카테고리, 마지막 2개는 24h 안쪽 (NEW 뱃지 유지)
  update categories set created_at = kst_midnight - interval '14 days' where id = 'c0000000-0000-0000-0000-000000000001';
  update categories set created_at = kst_midnight - interval '13 days' where id = 'c0000000-0000-0000-0000-000000000002';
  update categories set created_at = kst_midnight - interval '11 days' where id = 'c0000000-0000-0000-0000-000000000003';
  update categories set created_at = kst_midnight - interval '9 days'  where id = 'c0000000-0000-0000-0000-000000000004';
  update categories set created_at = kst_midnight - interval '7 days'  where id = 'c0000000-0000-0000-0000-000000000005';
  update categories set created_at = kst_midnight - interval '5 days'  where id = 'c0000000-0000-0000-0000-000000000006';
  update categories set created_at = kst_midnight + interval '1 hour'  where id = 'c0000000-0000-0000-0000-000000000007';
  update categories set created_at = kst_midnight + interval '4 hours' where id = 'c0000000-0000-0000-0000-000000000008';

  -- ── posts ────────────────────────────────────────────────────────
  -- KST 오늘 00:30 ~ 06:00 사이에 작성 순서대로 배치.
  -- cron(KST 00:00) 직후 잠시 미래 시각이 되지만, timeAgo 가 미래를
  -- '방금 전' 으로 처리하므로 화면은 깨지지 않고 06:00 경 정상화된다.
  update posts set created_at = kst_midnight + interval '30 minutes'         where id = 'b0000000-0000-0000-0000-000000000001';
  update posts set created_at = kst_midnight + interval '1 hour 30 minutes'  where id = 'b0000000-0000-0000-0000-000000000002';
  update posts set created_at = kst_midnight + interval '2 hours 30 minutes' where id = 'b0000000-0000-0000-0000-000000000003';
  update posts set created_at = kst_midnight + interval '3 hours'            where id = 'b0000000-0000-0000-0000-000000000004';
  update posts set created_at = kst_midnight + interval '3 hours 20 minutes' where id = 'b0000000-0000-0000-0000-000000000005';
  update posts set created_at = kst_midnight + interval '4 hours'            where id = 'b0000000-0000-0000-0000-000000000006';
  update posts set created_at = kst_midnight + interval '4 hours 20 minutes' where id = 'b0000000-0000-0000-0000-000000000007';
  update posts set created_at = kst_midnight + interval '5 hours'            where id = 'b0000000-0000-0000-0000-000000000008';
  update posts set created_at = kst_midnight + interval '5 hours 30 minutes' where id = 'b0000000-0000-0000-0000-000000000009';
  update posts set created_at = kst_midnight + interval '6 hours'            where id = 'b0000000-0000-0000-0000-000000000010';

  -- ── notices ──────────────────────────────────────────────────────
  -- 도시가스 점검 공지를 오늘 하루 활성 + 미만료 상태로 되돌린다
  update notices
     set created_at = kst_midnight + interval '4 hours',
         expires_at = kst_midnight + interval '1 day',
         is_active  = true
   where created_by = 'a0000000-0000-0000-0000-000000000002'
     and content like '강남 일대 도시가스%';

  -- ── weekly_topics ────────────────────────────────────────────────
  update weekly_topics
     set week_start = date_trunc('week', now() at time zone 'Asia/Seoul')::date,
         is_active  = true
   where id = 'd0000000-0000-0000-0000-000000000001';
end;
$$;
