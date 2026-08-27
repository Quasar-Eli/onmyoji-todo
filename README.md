# 多游戏攻略 Wiki (React + Supabase)

基于 Supabase 的多游戏攻略图鉴平台，技术栈 **Vite + React + TypeScript + Tailwind CSS + shadcn/ui**，数据由 Supabase（Postgres + Auth + RLS）驱动，通过 GitHub Actions 自动部署到 GitHub Pages。

## 功能

- **多游戏栏目**：每个游戏一个独立栏目，独立的首页、分类、模块与文章结构
- **式神图鉴**：每个游戏可独立维护式神/角色图鉴，含立绘、稀有度筛选、培养 / 御魂 / 毕业面板 / PVE & PVP 就业攻略（已收录《阴阳师》240+ 位式神）
- **文章攻略**：栏目 → 分类 → 模块 → 文章的结构化内容组织，支持 Markdown 渲染
- **用户系统**：注册 / 登录 / 个人资料
- **后台管理**：超管 / 全局编辑 / 栏目管理员三级权限，可视化管理游戏、文章、式神
- **评论系统**：登录用户可在文章下评论与回复

## 技术栈

- 前端：Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui
- 后端：Supabase（Postgres + Auth + RLS）
- 部署：GitHub Actions → GitHub Pages

## 本地开发

```bash
npm install
npm run dev      # 开发预览（默认 http://localhost:5173）
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

## 环境变量

复制 `.env.example` 为 `.env`，填入你的 Supabase 项目配置：

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

数据库表结构与 RLS 策略见 `supabase/schema.sql`（含初始超管账号 `admin` / `admin888`，上线前请务必修改）。

## 部署到 GitHub Pages

1. 推送代码到 `main` 分支
2. 仓库 **Settings → Pages** → Source 选 `GitHub Actions`
3. 推送后 `.github/workflows/deploy.yml` 自动构建部署
4. 访问 `https://<你的用户名>.github.io/<仓库名>/`

> `vite.config.ts` 已设置 `base: "./"`，可部署到任意子路径。

## 免责声明

本项目为**个人学习项目**，仅用于技术学习与交流，不用于任何商业用途，亦不提供任何形式的商业服务或变现。

- 项目中涉及的各游戏名称、角色形象、立绘画作、技能设定、游戏文案等所有相关素材的知识产权、商标权及相关权利，均归其原始权利人所有。
- 本项目不主张对这些素材的任何权利，仅以学习和展示为目的进行引用。
- 如有任何内容侵犯了您的合法权益，请通过 [Issues](../../issues) 联系，确认后将在第一时间删除相关内容。

使用本项目代码或素材时，请自觉遵守上述声明及原始权利方的相关授权条款；因不当使用产生的任何纠纷与本项目作者无关。
