# 📋 CareerGPS MVP 极速开发任务清单 (TODO)

> **原则**：每次只完成一个子任务，完成后在浏览器进行功能测试，无误后执行 `git commit` 存档打钩，再继续下一个任务！

---

## 阶段一：项目初始化与环境配置 (Project Setup)

- [x] **1.1 脚手架创建**  
  * 任务：使用 Next.js App Router + TypeScript + Tailwind CSS 创建项目基础骨架。  
  * 验证：本地运行 `npm run dev`，浏览器成功打开默认 Hello World 页面。

- [x] **1.2 注入项目规范文档**  
  * 任务：在根目录下创建 `docs/` 文件夹，放入 `PRD.md`、`ARCHITECTURE.md` 和 `TODO.md`。  
  * 验证：检查文件夹目录是否结构清晰。

- [x] **1.3 Git 建立第一个存档点**  
  * 任务：在终端执行 `git init`，添加所有文件并提交。  
  * 命令：`git add .` -> `git commit -m "chore: 项目初始化与文档配置"`

---

## 阶段二：后端基础设施与用户认证 (Supabase & Auth)

- [x] **2.1 Supabase 客户端初始化**  
  * 任务：安装 `@supabase/supabase-js`，在 `lib/supabase/` 配置客户端和服务端连接 SDK，配置 `.env.local` 环境变量。  
  * 验证：控制台打印 Supabase 连接正常，无报错。

- [x] **2.2 数据库建表 (Database Schema)**  
  * 任务：在 Supabase SQL Editor 中运行 `docs/sql/init_schema.sql`，创建 `user_profiles`、`chat_sessions`、`chat_messages`、`assessment_questions` 四张表。  
  * 验证：Supabase Table Editor 页面成功看到这 4 张表。

- [x] **2.3 登录/注册页面 UI 与逻辑 (`/login`)**  
  * 任务：使用 shadcn/ui 搭建极简登录卡片，实现“纯邮箱 + 验证码”及 GitHub OAuth 登录与回调。  
  * 验证：能够成功收到验证码邮件，登录后自动重定向至 Dashboard。

---

## 阶段三：核心 UI 框架与全局导航 (Layout & Shared Components)

- [x] **3.1 全局 Layout 与 Header 导航**  
  * 任务：编写全局 `Navbar`，包含 Logo、模块切换 Tab、用户头像下拉菜单及“每日剩余额度 (QuotaBadge)”组件。  
  * 验证：未登录状态访问受保护页面会自动拦截跳回 `/login`。

- [x] **3.2 模块二：岗位全景与思维导图页 (`/mindmap`)**  
  * 任务：前端渲染职业分类树状图，点击末端岗位节点，平滑弹出半屏 Popover。半屏卡片接入 AI 实时调取/生成岗位基本信息（薪资、硬技能、内卷烈度）。  
  * 验证：点击“AI产品经理”，能流畅弹出格式清晰的岗位透视数据。

- [x] **3.3 模块三：自我探索与 12 题测评页 (`/assessment`)**  
  * 任务：提供 MBTI/霍兰德结果手动填空框与外链；下方渲染 12 道自研单选题表单。提交后计算标签并写入 Supabase `user_profiles` 表。  
  * 验证：完成测试后，页面成功展示生成的可视化标签卡片（如 `[实践派]`）。

---

## 阶段四：核心 AI Agent 功能实现 (Core Agent Modules)

- [x] **4.1 统一 AI 聊天 API 路由与 DeepSeek 接入 (`/api/chat`)**  
  * 任务：基于 Vercel AI SDK 接入 DeepSeek API，实现 Server-Sent Events (SSE) 流式打字响应，并集成每日额度扣减逻辑。  
  * 验证：API 接口能够实时打字返回回复。

- [x] **4.2 模块四：生涯规划 Agent 交互页 (`/planner`)**  
  * 任务：搭建对话界面。后端在发送请求前，自动拼接 Supabase 数据库中当前用户的年级与测评标签作为 System Prompt。对话内容实时存入 `chat_messages` 表。  
  * 验证：刷新页面或跨会话重新打开时，聊天记录依然保留，且 AI 依然记得用户的性格标签。

- [x] **4.3 简历与敏感信息自动脱敏工具 (`lib/utils/sanitize.ts`)**  
  * 任务：编写正则脱敏函数，将输入的文本/文件内容中的手机号、邮箱、身份证、真实姓名屏蔽遮蔽。  
  * 验证：输入“我叫张三，电话13800138000”，输出“我叫**，电话138****8000”。

- [x] **4.4 模块五：岗位排雷 / JD / 简历 Agent 页 (`/resume-agent`)**  
  * 任务：实现文件/图片解析上传，过脱敏逻辑后交由 AI。根据上传内容（单JD / 单简历 / JD+简历）触发动态路由分析；若为初创公司，调用企业数据接口查询资质风险。  
  * 验证：上传简历+JD 截图，AI 准确输出胜任力 Match 打分与 Markdown 改写建议。
  * 实现：`/api/parse-resume`（解析+脱敏）、`/api/company-check`（企业排雷 mock）、`/api/resume-agent`（流式分析）、`components/resume-agent/*`；文本/.txt 上传已支持，图片 OCR 预留后续扩展。

---

## 阶段五：性能优化与安全安全强化 (Polishing & Security)

- [x] **5.1 额度限制与异常兜底**  
  * 任务：用户额度耗尽（0次）时拦截对话请求，弹出“明日刷新”提示；所有 API 调用添加 `try...catch` 与前端 Toast 报错提示。  
  * 验证：模拟额度耗尽，能够准确拦截并给予友好提示。
  * 实现：`QuotaProvider` + `QuotaExhaustedDialog` + `sonner` Toast；`/api/quota` 刷新额度；Planner / 简历 Agent 客户端预检 + 429 拦截。

- [ ] **5.2 全站响应式适配与 UI 细节微调**  
  * 任务：优化移动端/平板端浏览体验，确保思维导图与聊天框在手机屏幕上也能流畅操作。

---

## 阶段六：上线部署与全网 Release (Deployment)

- [ ] **6.1 代码 GitHub 托管**  
  * 任务：创建 GitHub Remote 仓库，将本地代码 `git push` 上传。

- [ ] **6.2 Vercel 一键部署上线**  
  * 任务：在 Vercel 导入 GitHub 仓库，配置环境变量（Supabase Key, DeepSeek Key），点击 Deploy。  
  * 验证：获得公网独立域名（如 `careergps.vercel.app`），全网可流畅访问并成功注册使用！
