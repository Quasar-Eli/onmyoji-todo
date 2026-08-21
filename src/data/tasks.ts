export type Frequency = "daily" | "weekly"

/** 性价比分级：高 = 必做；中 = 有余力做；低 = 收益低可跳过 */
export type CostLevel = "high" | "medium" | "low"

export interface Task {
  id: string
  name: string
  desc: string
  reward: string[]
  frequency: Frequency
  /** 性价比分级（基于主流攻略整理的常驻判断） */
  cost: CostLevel
}

export const COST_LABEL: Record<CostLevel, string> = {
  high: "高性价比",
  medium: "有余力做",
  low: "可跳过",
}

export const TASKS: Task[] = [
  // ── 每日 ──
  {
    id: "diyu",
    name: "地域鬼王",
    desc: "打地域鬼王拿勾玉，公认性价比最高的日常",
    reward: ["勾玉 ~40", "御魂", "金币"],
    frequency: "daily",
    cost: "high",
  },
  {
    id: "huhezhan",
    name: "花合战（活跃度）",
    desc: "完成花合战任务攒活跃，每周拉满拿大量资源（当前版活跃系统）",
    reward: ["勾玉", "体力", "黑蛋碎片", "御魂"],
    frequency: "daily",
    cost: "high",
  },
  {
    id: "fengmo",
    name: "逢魔之时",
    desc: "17:00-23:00 点几下领奖励 + 挂 Boss",
    reward: ["徽章", "御魂", "随机奖励"],
    frequency: "daily",
    cost: "high",
  },
  {
    id: "jijieka",
    name: "结界卡寄养 / 换卡",
    desc: "更换结界卡 + 寄养（每 6h 一次），多加好友收益高",
    reward: ["勾玉", "体力", "随机结界卡"],
    frequency: "daily",
    cost: "high",
  },
  {
    id: "seal",
    name: "悬赏封印",
    desc: "完成式神悬赏，随机碎片 + 勾玉",
    reward: ["随机式神碎片", "勾玉", "经验"],
    frequency: "daily",
    cost: "high",
  },
  {
    id: "signin",
    name: "每日签到 / 寮签到",
    desc: "庭院签到 + 阴阳寮签到，顺手领",
    reward: ["勾玉", "体力", "金币"],
    frequency: "daily",
    cost: "medium",
  },
  {
    id: "yuhun",
    name: "魂土（御魂本）",
    desc: "刷御魂 / 魂十一，与花合战任务绑定",
    reward: ["御魂", "青吉鬼"],
    frequency: "daily",
    cost: "medium",
  },
  {
    id: "weipai",
    name: "式神委派 / 委托",
    desc: "委派式神出任务收菜，顺带捐碎片",
    reward: ["经验", "觉醒材料", "随机碎片"],
    frequency: "daily",
    cost: "medium",
  },
  {
    id: "feedpet",
    name: "喂小宠物",
    desc: "喂食宠物领奖励，蓝票概率大",
    reward: ["随机奖励", "蓝票概率", "亲密度"],
    frequency: "daily",
    cost: "medium",
  },
  {
    id: "jiayou",
    name: "赠送友情点",
    desc: "给好友送友情点，顺手完成",
    reward: ["友情点", "随机碎片"],
    frequency: "daily",
    cost: "medium",
  },
  {
    id: "jiejie",
    name: "结界突破",
    desc: "结界突破刷御魂勾玉，配合花合战",
    reward: ["勾玉", "御魂", "结界卡"],
    frequency: "daily",
    cost: "low",
  },
  {
    id: "yujing",
    name: "御灵副本",
    desc: "刷御灵（晴明/神乐等守护兽）",
    reward: ["御灵材料", "金币"],
    frequency: "daily",
    cost: "low",
  },
  {
    id: "awake",
    name: "觉醒副本",
    desc: "刷觉醒材料，当前版本基本用不上，仅花合战任务顺带",
    reward: ["觉醒材料", "体力"],
    frequency: "daily",
    cost: "low",
  },
  {
    id: "douji",
    name: "斗技上分",
    desc: "斗技上分，对咸鱼性价比低，周常领段位奖励即可",
    reward: ["荣誉", "斗技勋章"],
    frequency: "daily",
    cost: "low",
  },
  // ── 周常 ──
  {
    id: "mimi",
    name: "秘闻副本",
    desc: "限时挑战拿皮肤，一次性/每周",
    reward: ["式神皮肤", "勾玉", "御魂"],
    frequency: "weekly",
    cost: "high",
  },
  {
    id: "qilin",
    name: "麒麟 / 狩猎战",
    desc: "每周限次狩猎，寮活动",
    reward: ["御魂", "麒麟buff", "随机碎片"],
    frequency: "weekly",
    cost: "high",
  },
  {
    id: "xiajian",
    name: "狭间战 / 阴界之门",
    desc: "周五-周日，混狭间 + 阴界之门（后台挂机）",
    reward: ["勾玉", "御魂", "随机奖励"],
    frequency: "weekly",
    cost: "high",
  },
  {
    id: "shop",
    name: "商店刷新兑换",
    desc: "勋章 / 荣誉 / 神秘商店兑换周刷新",
    reward: ["黑蛋", "SSR碎片", "各种兑换物"],
    frequency: "weekly",
    cost: "medium",
  },
  {
    id: "yaoguai",
    name: "金币 / 经验妖怪",
    desc: "每天 2 次金币 + 经验妖怪，攒资源",
    reward: ["金币", "经验"],
    frequency: "weekly",
    cost: "medium",
  },
  {
    id: "douji_weekly",
    name: "斗技周结算",
    desc: "周末结算领段位奖励",
    reward: ["勾玉", "段位奖励", "头像框"],
    frequency: "weekly",
    cost: "medium",
  },
  {
    id: "contest",
    name: "当期活动 / 应援",
    desc: "周活动与应援任务，随版本变化",
    reward: ["活动道具", "皮肤", "勾玉"],
    frequency: "weekly",
    cost: "medium",
  },
]
