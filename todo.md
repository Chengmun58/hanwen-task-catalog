# Project TODO

## 全栈升级 + 文件存储集成

### 数据库 Schema
- [x] 添加 `uploadedFiles` 表（文件元数据：id, userId, filename, fileKey, fileUrl, fileSize, mimeType, category, createdAt）
- [ ] 添加 `lessons` 表（将 lessons.json 迁移到数据库，支持动态管理）（暂缓，课程数据已在 JSON 中稳定运行）
- [x] 运行 pnpm db:push 推送迁移

### 后端 tRPC 路由
- [x] 实现 `files.upload` 接口（接收文件 base64/buffer，上传到 S3，保存元数据到 DB）
- [x] 实现 `files.list` 接口（查询当前用户的文件列表）
- [x] 实现 `files.delete` 接口（删除文件元数据记录）
- [x] 实现 `files.update` 接口（更新文件分类和备注）
- [ ] 实现 `lessons.list` 接口（从 DB 读取课程列表）（暂缓）
- [ ] 实现 `lessons.getById` 接口（获取单个课程详情）（暂缓）

### 前端界面
- [x] 创建 `FilesPage.tsx` 文件管理页面（上传、列表、删除）
- [x] 实现文件拖拽上传组件（支持 PDF、图片、音频等学习资料）
- [x] 实现文件列表展示（文件名、大小、类型、上传时间）
- [x] 实现文件预览/下载功能
- [x] 在 DashboardLayout 侧边栏添加"学习资料"导航入口
- [x] 更新 App.tsx 添加文件管理路由
- [ ] 将 Home.tsx 集成到 DashboardLayout 中（暂缓，主页保持独立设计）

### 测试
- [x] 编写文件上传路由的 Vitest 测试（8个测试全部通过）
- [x] 验证文件上传、列表、删除流程（TypeScript 编译无错误，测试全通过）
