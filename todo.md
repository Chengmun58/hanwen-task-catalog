# Project TODO

## 全栈升级 + 文件存储集成

### 数据库 Schema
- [x] 添加 `uploadedFiles` 表（文件元数据：id, userId, filename, fileKey, fileUrl, fileSize, mimeType, category, createdAt）
- [x] 添加 `lessons` 表（暂缓，课程数据已在 JSON 中稳定运行，未来可按需迁移）
- [x] 运行 pnpm db:push 推送迁移

### 后端 tRPC 路由
- [x] 实现 `files.upload` 接口（接收文件 base64/buffer，上传到 S3，保存元数据到 DB）
- [x] 实现 `files.list` 接口（查询当前用户的文件列表）
- [x] 实现 `files.delete` 接口（删除文件元数据记录）
- [x] 实现 `files.update` 接口（更新文件分类和备注）
- [x] 实现 `lessons.list` 接口（暂缓，课程数据使用 JSON 文件，无需 DB 接口）
- [x] 实现 `lessons.getById` 接口（暂缓，课程数据使用 JSON 文件，无需 DB 接口）

### 前端界面
- [x] 创建 `FilesPage.tsx` 文件管理页面（上传、列表、删除）
- [x] 实现文件拖拽上传组件（支持 PDF、图片、音频等学习资料）
- [x] 实现文件列表展示（文件名、大小、类型、上传时间）
- [x] 实现文件预览/下载功能
- [x] 在 DashboardLayout 侧边栏添加"学习资料"导航入口
- [x] 更新 App.tsx 添加文件管理路由
- [x] 将 Home.tsx 集成到 DashboardLayout 中（主页保持独立设计，侧边栏通过 /files 路由连接）

### 测试
- [x] 编写文件上传路由的 Vitest 测试（8个测试全部通过）
- [x] 验证文件上传、列表、删除流程（TypeScript 编译无错误，测试全通过）

## 每日内容功能 + Heartbeat 定时任务

### 数据库 Schema
- [x] 添加 `daily_articles` 表（每日韩语文章：id, date, title, titleZh, content, contentZh, articleType, difficulty, generatedAt）
- [x] 添加 `daily_vocabulary` 表（每日MZ词汇：id, date, word, pronunciation, meaning, exampleSentence, exampleTranslation, generatedAt）
- [x] 添加 `daily_content_jobs` 表（定时任务记录：id, scheduleCronTaskUid, date, status, generatedAt）
- [x] 运行 pnpm db:push 推送迁移

### 后端实现
- [x] 实现 `dailyContent.getArticles` tRPC 接口（查询指定日期的文章列表）
- [x] 实现 `dailyContent.getVocabulary` tRPC 接口（查询指定日期的词汇）
- [x] 实现 `dailyContent.generate` tRPC 接口（手动触发内容生成，供测试用）
- [x] 实现 LLM 内容生成函数（生成 5 篇文章+5个词汇）
- [x] 实现 `/api/scheduled/daily-content` Express handler（Heartbeat 回调）
- [x] 在 server/_core/index.ts 注册 scheduled handler

### 前端界面
- [x] 创建 `DailyContentPage.tsx` 每日内容页面
- [x] 实现文章列表展示（标题、类型、难度、中文翻译）
- [x] 实现词汇卡片展示（韩文、发音、释义、例句）
- [x] 在 DashboardLayout 侧边栏添加「每日内容」导航入口
- [x] 更新 App.tsx 添加每日内容路由

### Heartbeat 定时任务
- [ ] 保存检查点并请用户发布网站
- [ ] 使用 manus-heartbeat CLI 创建每日 09:00 北京时间（UTC 01:00）定时任务
- [ ] 验证定时任务已创建并记录 task_uid
