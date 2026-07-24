-- ============================================================
-- CareerGPS MVP 数据库初始化脚本
-- 来源：docs/ARCHITECTURE.md 第 4 节 Database Schema
--
-- 使用方法：
--   1. 打开 Supabase Dashboard -> SQL Editor -> New query
--   2. 全选复制本文件内容，粘贴后点击 Run
--   3. 前往 Table Editor，确认以下 4 张表已创建：
--      user_profiles / chat_sessions / chat_messages / assessment_questions
-- ============================================================

-- ------------------------------------------------------------
-- 1. 用户扩展信息表 (user_profiles)
-- 扩展 Supabase 自带的 auth.users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti VARCHAR(10),
  holland VARCHAR(10),
  assessment_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_quota_used INT NOT NULL DEFAULT 0,
  last_quota_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS '用户扩展资料：测评结果、标签与每日 AI 额度';
COMMENT ON COLUMN public.user_profiles.mbti IS 'MBTI 类型，如 INTJ';
COMMENT ON COLUMN public.user_profiles.holland IS '霍兰德代码，如 RIA';
COMMENT ON COLUMN public.user_profiles.assessment_tags IS '12 题自研测评生成的标签数组';
COMMENT ON COLUMN public.user_profiles.daily_quota_used IS '当天已消耗的免费 Agent 调用次数';
COMMENT ON COLUMN public.user_profiles.last_quota_reset IS '上次重置 daily_quota_used 的时间';

-- ------------------------------------------------------------
-- 2. 对话会话表 (chat_sessions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type VARCHAR(20) NOT NULL,
  title VARCHAR(100) NOT NULL DEFAULT '新对话',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_sessions_agent_type_check
    CHECK (agent_type IN ('planner', 'resume'))
);

COMMENT ON TABLE public.chat_sessions IS 'AI 对话会话，区分生涯规划与简历排雷 Agent';
COMMENT ON COLUMN public.chat_sessions.agent_type IS 'planner=生涯规划, resume=排雷改简历';

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
  ON public.chat_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_agent
  ON public.chat_sessions(user_id, agent_type);

-- ------------------------------------------------------------
-- 3. 对话消息明细表 (chat_messages)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_messages_role_check
    CHECK (role IN ('user', 'assistant', 'system'))
);

COMMENT ON TABLE public.chat_messages IS '持久化聊天记录，支持跨设备与隔天记忆';
COMMENT ON COLUMN public.chat_messages.attachments IS '附件/图片 URL 数组';

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
  ON public.chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON public.chat_messages(session_id, created_at);

-- ------------------------------------------------------------
-- 4. 自研测评题目配置表 (assessment_questions)
-- MVP 也可在前端 lib/constants 中维护静态题库；此表便于后续运营后台改题
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension VARCHAR(50) NOT NULL,
  order_index INT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT assessment_questions_dimension_check
    CHECK (dimension IN (
      'risk_stability',
      'work_life_balance',
      'ability_talent',
      'tolerance_baseline'
    )),
  CONSTRAINT assessment_questions_order_index_check
    CHECK (order_index BETWEEN 1 AND 12),
  CONSTRAINT assessment_questions_options_is_array
    CHECK (jsonb_typeof(options) = 'array')
);

COMMENT ON TABLE public.assessment_questions IS '12 道自研测评题配置（4 维度 × 3 题）';
COMMENT ON COLUMN public.assessment_questions.dimension IS 'risk_stability | work_life_balance | ability_talent | tolerance_baseline';
COMMENT ON COLUMN public.assessment_questions.options IS '选项数组，示例：[{"label":"A","text":"...","tag":"实战派"}]';

CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_questions_order_index
  ON public.assessment_questions(order_index);

-- ------------------------------------------------------------
-- 5. 新用户注册时自动创建 user_profiles 记录
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- user_profiles：用户只能读写自己的资料
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- chat_sessions：用户只能管理自己的会话
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own chat sessions"
  ON public.chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can create own chat sessions"
  ON public.chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can update own chat sessions"
  ON public.chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can delete own chat sessions"
  ON public.chat_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- chat_messages：用户只能访问自己会话下的消息
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own chat messages" ON public.chat_messages;
CREATE POLICY "Users can create own chat messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
CREATE POLICY "Users can update own chat messages"
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  );

-- assessment_questions：所有登录用户可读，写入由 service_role 在后台完成
DROP POLICY IF EXISTS "Authenticated users can read assessment questions" ON public.assessment_questions;
CREATE POLICY "Authenticated users can read assessment questions"
  ON public.assessment_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 执行完成后，可在 SQL Editor 运行以下查询做快速验收：
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'user_profiles',
--     'chat_sessions',
--     'chat_messages',
--     'assessment_questions'
--   )
-- ORDER BY table_name;
-- ============================================================
