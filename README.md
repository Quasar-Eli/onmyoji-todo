# 阴阳师 · 每日代办清单 (React + shadcn/ui)

一个简约美观的阴阳师每日/周常任务打卡工具站，技术栈 **Vite + React + TypeScript + Tailwind CSS + shadcn/ui**，通过 GitHub Actions 自动部署到 GitHub Pages。

## 功能

- 内置阴阳师常驻**每日任务**与**周常任务**
- 每个任务展示**可获得奖励**（勾玉 / 体力 / 御魂 / 碎片等）
- 点击勾选打卡，自动计算完成度与进度条
- 每日 0 点自动重置（localStorage 持久化，纯前端）
- 深色简约 UI，移动端适配

## 本地开发

```bash
npm install
npm run dev      # 开发预览
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

## 部署到 GitHub Pages

1. 新建 GitHub 仓库（如 `onmyoji-todo`），推送代码到 `main` 分支
2. 仓库 → **Settings → Pages** → Source 选 `GitHub Actions`
3. 推送代码后，`.github/workflows/deploy.yml` 会自动构建并部署
4. 访问 `https://<你的用户名>.github.io/onmyoji-todo/`

> 本仓库已在 `vite.config.ts` 设置 `base: "./"`，可部署到任意子路径。

## 自定义任务与奖励

编辑 `src/data/tasks.ts`，每个任务结构：

```ts
{
  id: "signin",
  name: "每日签到",
  desc: "庭院签到 + 阴阳寮签到",
  reward: ["勾玉", "体力", "金币"],
  frequency: "daily",   // "daily" | "weekly"
  optional: false,      // 可选标记（斗技等非必做）
}
```

改完推送，GitHub Actions 自动重新部署。

## 说明

- 纯静态站，无法自动读取游戏内进度，需手动勾选打卡。
- 数据仅存浏览器本地，清除浏览器数据会丢失；跨设备同步需接入后端（如 Supabase）。
