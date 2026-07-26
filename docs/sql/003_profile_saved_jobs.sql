-- ============================================================
-- CareerGPS：个人主页 - 岗位收藏字段
-- 在 Supabase SQL Editor 中执行
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS saved_jobs JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.user_profiles.saved_jobs IS
  '收藏的岗位列表，示例：[{"title":"AI产品经理","savedAt":"2026-07-27T00:00:00.000Z"}]';
