# 🏗️ CareerGPS 技术架构与代码规范文档 (ARCHITECTURE)

> **版本**：v1.0 (MVP)  
> **面向对象**：Coding Agent (Cursor / Claude Code) & 零基础开发者  
> **核心原则**：高可读性、高聚合度、零冗余设计，杜绝过度设计。

---

## 1. 🛠️ 技术栈清单 (Tech Stack)

* **全栈框架**：Next.js 14+ (App Router, React 18, TypeScript)
* **UI 样式与组件库**：Tailwind CSS + shadcn/ui + Lucide Icons
* **后端服务与数据库**：Supabase (PostgreSQL + Auth + Storage)
* **AI 引擎与 API 代理**：DeepSeek API (DeepSeek-V3 / R1) + 硅基流动 (SiliconFlow) 代理
* **第三方数据**：天眼查 / 企查查 API (用于企业排雷)
* **部署平台**：Vercel / 腾讯云轻量应用服务器 + EdgeOne CDN

---

## 2. 📂 项目目录结构 (Directory Structure)

项目采用 Next.js 标准 App Router 架构，结构清晰、层级扁平：

careergps/
├── app/                        # Next.js App Router 核心路由与页面
│   ├── (auth)/                 # 认证相关页面组（不带路由前缀）
│   │   ├── login/page.tsx      # 登录/注册页
│   │   └── auth/callback/route.ts # OAuth / 邮箱验证回调处理
│   ├── (dashboard)/            # 需登录后的主业务页面组
│   │   ├── mindmap/page.tsx    # 模块二：岗位全景与思维导图页
│   │   ├── assessment/page.tsx # 模块三：自我探索与 12 题自研测评页
│   │   ├── planner/page.tsx    # 模块四：生涯规划 Agent 聊天页
│   │   └── resume-agent/page.tsx # 模块五：岗位排雷/JD/简历 Agent 页
│   ├── api/                    # 后端 API 接口（Serverless Routes）
│   │   ├── chat/route.ts       # 流式 AI 对话统一接口
│   │   ├── parse-resume/route.ts # 简历/JD 文件解析与脱敏接口
│   │   └── company-check/route.ts # 天眼查企业排雷数据接口
│   ├── layout.tsx              # 全局根布局（含 Navigation、User Header）
│   └── page.tsx                # 产品 Landing Page（首页/介绍页）
├── components/                 # 可复用 UI 组件
│   ├── ui/                     # shadcn/ui 基础组件 (Button, Dialog, Input等)
│   ├── mindmap/                # 思维导图渲染组件
│   ├── assessment/             # 12 题测试卡片与标签展示组件
│   ├── chat/                   # 通用 AI 聊天对话框组件（支持流式打字）
│   └── shared/                 # 全局共享组件 (Navbar, Footer, QuotaBadge)
├── lib/                        # 工具函数、客户端与 SDK 初始化
│   ├── supabase/               # Supabase 客户端与服务端配置
│   ├── ai/                     # DeepSeek API 封装与 System Prompt 模版
│   ├── utils/                  # 通用工具函数 (如：正则脱敏敏感信息)
│   └── constants/              # 全局常量（如 12 道自研测试题库、配额上限等）
├── docs/                       # 项目研发文档
│   ├── PRD.md                  # 产品需求文档
│   ├── ARCHITECTURE.md         # 本技术架构文档
│   └── TODO.md                 # 步骤开发清单
├── types/                      # TypeScript 类型定义文件
│   ├── database.ts             # 自动导出的 Supabase 数据库类型
│   └── index.ts                # 全局业务类型定义 (如 UserProfile, AssessmentResult)
├── public/                     # 静态资源（图片、Logo、图标等）
└── middleware.ts               # Next.js 中间件（处理路由鉴权与未登录拦截）

---

## 3. 🧩 核心模块划分 (Core Modules)

1. **User & Auth 模块 (`app/(auth)`, `lib/supabase`)**
   * 处理用户注册登录、Session 状态保持、每日免费额度（Quota）限制校验。
2. **Mindmap 模块 (`app/(dashboard)/mindmap`)**
   * 展示行业岗位树，点击触发微型 API 生成或调取最新的岗位基本信息半屏弹窗。
3. **Assessment 模块 (`app/(dashboard)/assessment`)**
   * 提供 MBTI/霍兰德结果手动录入与 12 道自研题目表单，算分后将标签写入数据库 `user_profiles` 表。
4. **Agent Core 模块 (`app/api/chat`, `components/chat`)**
   * 采用 Vercel AI SDK 实现 SSE（Server-Sent Events）流式响应。
   * 发送 Prompt 前，**自动在后端拼入当前用户的测评标签与历史上下文**。
5. **Security & Parser 模块 (`lib/utils`, `app/api/parse-resume`)**
   * 上传文件解析后，在客户端/后端经由正则匹配遮蔽电话、姓名、邮箱等敏感数据后再提交给 AI。

---

## 4. 🗄️ 数据模型设计 (Database Schema)

基于 Supabase (PostgreSQL)，设计 4 张核心表，满足 MVP 所有业务诉求：

### 1) 用户扩展信息表 (`user_profiles`)
扩展 Supabase 自带的 `auth.users` 表。

CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  mbti VARCHAR(10),                             -- 手动输入或测试的 MBTI 结果
  holland VARCHAR(10),                          -- 手动输入的霍兰德代码 (如 RIA)
  assessment_tags JSONB DEFAULT '[]'::jsonb,   -- 12 题自研测评计算出的标签数组
  daily_quota_used INT DEFAULT 0,              -- 当天已使用的免费额度
  last_quota_reset TIMESTAMPTZ DEFAULT NOW(),   -- 上次刷新额度的时间
  created_at TIMESTAMPTZ DEFAULT NOW()
);

### 2) 对话会话表 (`chat_sessions`)
管理用户的多个 AI 对话窗口（如“生涯规划对话”、“某岗位排雷对话”）。

CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type VARCHAR(20) NOT NULL,              -- 'planner' (生涯规划) 或 'resume' (排雷改简历)
  title VARCHAR(100) DEFAULT '新对话',           -- 会话标题
  created_at TIMESTAMPTZ DEFAULT NOW()
);

### 3) 对话消息明细表 (`chat_messages`)
存储持久化的聊天记录，实现跨设备与隔天记忆功能。

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL,                    -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,                        -- 对话文本内容
  attachments JSONB DEFAULT '[]'::jsonb,        -- 关联的附件/图片 URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

### 4) 自研测评题目与选项配置表 (`assessment_questions`)
用于存放 12 道自研测试题（也可直接在前端定义为静态常量）。

---

## 5. 📝 代码规范与 AI 协作建议 (Coding Standards)

零基础使用 Cursor / Claude Code 开发时，**必须强制要求 AI 遵守以下规则**：

### 命名规范
* **组件文件与 React 组件**：使用 **PascalCase**（大驼峰）
  * 示例：`components/chat/ChatBox.tsx` ➜ `export function ChatBox() {}`
* **普通工具函数/变量**：使用 **camelCase**（小驼峰）
  * 示例：`function sanitizeResumeText(text: string) {}`
* **路由文件夹与静态文件**：使用 **kebab-case**（短横线间隔）
  * 示例：`app/(dashboard)/resume-agent/page.tsx`
* **环境变量**：使用 **UPPER_SNAKE_CASE**（全大写下划线）
  * 示例：`NEXT_PUBLIC_SUPABASE_URL`、`DEEPSEEK_API_KEY`

### 零基础开发三不原则
1. **不多写一行用不到的代码**：不要引入复杂的全局状态管理库（如 Redux），简单状态用 React 原生的 `useState`，全局状态用 Supabase 查表或 React Context 即可。
2. **函数必须写明注释**：要求 AI 在编写任何超过 15 行的函数前，使用 `/** */` 注释写明该函数的作用、输入参数与返回值。
3. **严格的错误捕获与提示**：所有的 API 请求（如调用 DeepSeek 或天眼查）必须包含 `try...catch` 块，并在前端 UI 上显示用户看得懂的错误提示（如使用 `toast.error("网络开小差了，请重试")`）。
