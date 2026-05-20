-- ════════════════════════════════════════════════════════════════════
--  RE:LAY — 시드 데이터 timestamp 갱신 함수
--
--  Supabase SQL Editor 에서 1회 실행하여 함수를 생성한다.
--  이후 Vercel Cron(매일 KST 00:00)이 /api/reseed 를 호출하면
--  이 함수가 실행되어 seed 의 UUID 에 해당하는 행만 timestamp 가
--  '지금 시점' 기준으로 다시 갱신된다.
--
--  ⚠ 운영 중 추가된 사용자/글/카테고리/공지는 ID 가 다르므로
--    이 함수의 영향을 받지 않는다. (id 정확 매칭으로 update 만 수행)
-- ════════════════════════════════════════════════════════════════════

create or replace function refresh_seed_timestamps() returns void
language plpgsql
as $$
begin
  -- ── categories ───────────────────────────────────────────────────
  -- 앞 6개는 오래된 카테고리, 마지막 2개는 24h 안쪽 (NEW 뱃지 유지)
  update categories set created_at = now() - interval '14 days' where id = 'c0000000-0000-0000-0000-000000000001';
  update categories set created_at = now() - interval '13 days' where id = 'c0000000-0000-0000-0000-000000000002';
  update categories set created_at = now() - interval '11 days' where id = 'c0000000-0000-0000-0000-000000000003';
  update categories set created_at = now() - interval '9 days'  where id = 'c0000000-0000-0000-0000-000000000004';
  update categories set created_at = now() - interval '7 days'  where id = 'c0000000-0000-0000-0000-000000000005';
  update categories set created_at = now() - interval '5 days'  where id = 'c0000000-0000-0000-0000-000000000006';
  update categories set created_at = now() - interval '6 hours' where id = 'c0000000-0000-0000-0000-000000000007';
  update categories set created_at = now() - interval '3 hours' where id = 'c0000000-0000-0000-0000-000000000008';

  -- ── posts ────────────────────────────────────────────────────────
  -- seed.sql 과 동일한 시간 분포로 '오늘' 안에 배치
  update posts set created_at = now() - interval '6 hours'    where id = 'b0000000-0000-0000-0000-000000000001';
  update posts set created_at = now() - interval '5 hours'    where id = 'b0000000-0000-0000-0000-000000000002';
  update posts set created_at = now() - interval '4 hours'    where id = 'b0000000-0000-0000-0000-000000000003';
  update posts set created_at = now() - interval '3 hours'    where id = 'b0000000-0000-0000-0000-000000000004';
  update posts set created_at = now() - interval '3 hours'    where id = 'b0000000-0000-0000-0000-000000000005';
  update posts set created_at = now() - interval '2 hours'    where id = 'b0000000-0000-0000-0000-000000000006';
  update posts set created_at = now() - interval '2 hours'    where id = 'b0000000-0000-0000-0000-000000000007';
  update posts set created_at = now() - interval '1 hour'     where id = 'b0000000-0000-0000-0000-000000000008';
  update posts set created_at = now() - interval '40 minutes' where id = 'b0000000-0000-0000-0000-000000000009';
  update posts set created_at = now() - interval '20 minutes' where id = 'b0000000-0000-0000-0000-000000000010';

  -- ── notices ──────────────────────────────────────────────────────
  -- seed 의 도시가스 점검 공지를 활성 + 미만료 상태로 되돌린다
  update notices
     set created_at = now() - interval '2 hours',
         expires_at = now() + interval '6 hours',
         is_active  = true
   where created_by = 'a0000000-0000-0000-0000-000000000002'
     and content like '강남 일대 도시가스%';

  -- ── weekly_topics ────────────────────────────────────────────────
  update weekly_topics
     set week_start = date_trunc('week', now())::date,
         is_active  = true
   where id = 'd0000000-0000-0000-0000-000000000001';
end;
$$;
