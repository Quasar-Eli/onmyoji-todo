// 写入"第三方工具网站"分类 + 各工具模块与内容
const { createClient } = require("@supabase/supabase-js")

const url = "https://zrjykkgnvkuwvkmkgadj.supabase.co"
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyanlra2dudmt1d3ZrbWtnYWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1Mjc2MTAsImV4cCI6MjEwMzEwMzYxMH0.aWpmSRy51TwjiEzpAqRKbWgUKRiR-smzumOP8dzt7l8"
const supabase = createClient(url, anonKey)

const gameId = "e213ff00-7022-4459-b13d-09e3b2b62461"

const tools = [
  {
    name: "痒痒鼠魔方",
    content: `## 简介
痒痒鼠魔方（**yyshub.top**）是阴阳师玩家最常用的御魂数据工具之一，功能强大。

## 主要功能
- **御魂计算**：输入面板自动计算毕业面板 / 配速
- **御魂分析**：导入御魂数据，一键分析强化收益
- **博物馆**：查看全服大佬的御魂配置参考
- **藏宝阁抓取**：快速解析藏宝阁账号的御魂练度

## 使用场景
- 配速计算（魂土/秘闻等阵容速度分配）
- 御魂强化价值判断
- 买号前快速评估账号练度

## 访问
> 官网：http://yyshub.top/
>
> 御魂分析子站：http://yuhun.yyshub.top/

> ⚠️ 部分功能需要登录网易账号或绑定角色，属玩家自制工具，非官方。`,
  },
  {
    name: "御魂 Hub",
    content: `## 简介
**御魂 Hub** 是阴阳师御魂数据导出与分析的经典工具，号称"痒痒鼠最实用的小工具之一"。

## 主要功能
- **御魂数据导出**：从游戏内导出全部御魂数据
- **御魂分析**：按套装/属性/分数筛选，快速定位优质御魂
- **阵容配置**：配置魂土等副本阵容，模拟速度与伤害

## 使用场景
- 整理自己的御魂仓库，找出值得强化的胚子
- 配置速刷阵容（如 19 秒魂土）
- 评估账号御魂质量

## 访问
> 官方入口：https://yuhunhub.com/（或通过痒痒鼠魔方子站 yuhun.yyshub.top）
>
> 使用教程：B站搜"御魂Hub使用教程"（高冷少年w 系列）

> ⚠️ 玩家自制工具，非官方。需要导出游戏数据配合使用。`,
  },
  {
    name: "阴阳师 BWIKI",
    content: `## 简介
**阴阳师 BWIKI**（哔哩哔哩 WIKI）是内容最全的阴阳师玩家百科，由社区维护。

## 主要功能
- **式神档册**：全部式神（UR/SP/SSR/SR/R/N）图鉴、立绘、传记
- **式神攻略**：技能、御魂搭配、就业分析
- **剧情资料**：式神传记、编年史、活动剧情
- **官方公告**：版本更新整理

## 使用场景
- 查式神图鉴、立绘、CV
- 了解式神背景故事与传记
- 关注版本更新与活动

## 访问
> 官网：https://wiki.biligame.com/yys/

> ⚠️ 玩家社区维护的非官方 wiki，内容仅供参考。`,
  },
  {
    name: "灰机 wiki 阴阳师",
    content: `## 简介
**灰机 wiki** 的阴阳师站点是另一个常用的玩家百科，页面风格简洁。

## 主要功能
- 式神图鉴与立绘
- 御魂、阵容攻略
- 数据整理与版本资料

## 访问
> 官网：https://yys.huijiwiki.com/

> ⚠️ 玩家社区维护的非官方 wiki。`,
  },
  {
    name: "4399 悬赏封印查询",
    content: `## 简介
**4399 阴阳师悬赏封印查询工具**是速查悬赏封印妖怪出处的工具。

## 主要功能
- 输入线索（如"冥界/白/夺命"）查询对应妖怪
- 查看妖怪在哪一章/哪一层刷最多（省体力打法）

## 使用场景
- 每日悬赏封印任务快速找到妖怪出处
- 规划最省体力的刷法

## 访问
> 官网：http://news.4399.com/yyssy/xsrw/

> ⚠️ 玩家向工具，非官方。`,
  },
  {
    name: "阴阳师藏宝阁",
    content: `## 简介
**阴阳师藏宝阁**（**yys.cbg.163.com**）是网易官方的阴阳师账号/道具交易平台。

## 主要功能
- **账号交易**：买卖角色（式神、御魂、资源）
- **道具交易**：交易 SSR、六星御魂等
- **估价参考**：平台提供估值，可查历史成交价

## 使用场景
- 买号 / 卖号 / 换号
- 参考账号行情价格

## 访问
> 官网：https://yys.cbg.163.com/

> ⚠️ 官方交易平台，交易安全有保障。买号务必走藏宝阁，避免第三方交易被骗。`,
  },
]

async function main() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@local.wiki",
    password: "admin888",
  })
  if (authError) {
    console.error("登录失败:", authError.message)
    return
  }

  // 1. 创建分类"第三方工具网站"（若不存在）
  const { data: existingCat } = await supabase
    .from("categories")
    .select("id")
    .eq("game_id", gameId)
    .eq("name", "第三方工具网站")
    .maybeSingle()
  let categoryId
  if (existingCat) {
    categoryId = existingCat.id
  } else {
    const { data: cat, error: catErr } = await supabase
      .from("categories")
      .insert({ game_id: gameId, name: "第三方工具网站", sort_order: 1 })
      .select()
      .single()
    if (catErr) {
      console.error("创建分类失败:", catErr.message)
      return
    }
    categoryId = cat.id
  }
  console.log("分类 ID:", categoryId)

  // 2. 为每个工具创建模块 + 内容
  let idx = 0
  for (const tool of tools) {
    // 检查模块是否已存在
    const { data: existingMod } = await supabase
      .from("modules")
      .select("id")
      .eq("category_id", categoryId)
      .eq("name", tool.name)
      .maybeSingle()
    if (existingMod) {
      console.log(`跳过已存在模块: ${tool.name}`)
      idx++
      continue
    }

    const { data: mod, error: modErr } = await supabase
      .from("modules")
      .insert({ game_id: gameId, category_id: categoryId, name: tool.name, sort_order: idx })
      .select()
      .single()
    if (modErr) {
      console.error(`创建模块失败 ${tool.name}:`, modErr.message)
      continue
    }
    console.log(`模块: ${tool.name} (${mod.id})`)

    const { error: artErr } = await supabase.from("articles").insert({
      game_id: gameId,
      category_id: categoryId,
      module_id: mod.id,
      title: tool.name,
      content: tool.content,
    })
    if (artErr) {
      console.error(`创建内容失败 ${tool.name}:`, artErr.message)
    }
    idx++
  }

  console.log("完成")
}

main()