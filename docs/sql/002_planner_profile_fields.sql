-- ============================================================
-- CareerGPS：Planner Agent 用户上下文字段
-- 在 Supabase SQL Editor 中运行（若 001 已执行过）
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20),
  ADD COLUMN IF NOT EXISTS target_role VARCHAR(100);

COMMENT ON COLUMN public.user_profiles.grade_level IS '年级，如：大二、研一、已毕业';
COMMENT ON COLUMN public.user_profiles.target_role IS '目标岗位，如：AI产品经理';
