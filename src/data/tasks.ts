export type Frequency = "daily" | "weekly"

export interface Task {
  id: string
  name: string
  desc: string
  reward: string[]
  frequency: Frequency
  optional?: boolean
}

export const TASKS: Task[] = [
  // ── 每日 ──
  { id: "signin", name: "每日签到", desc: "庭院签到 + 阴阳寮签到", reward: ["勾玉", "体力", "金币"], frequency: "daily" },
  { id: "daily_100", name: "活跃度 100", desc: "完成任务攒满活跃度，领宝箱", reward: ["随机御魂", "勾玉", "体力"], frequency: "daily" },
  { id: "coin", name: "花合战 / 月卡", desc: "领取花合战每日经验与月卡勾玉", reward: ["花合战经验", "勾玉", "体力"], frequency: "daily" },
  { id: "seal", name: "悬赏封印", desc: "完成式神悬赏任务，组队更快", reward: ["随机式神碎片", "勾玉", "经验"], frequency: "daily" },
  { id: "fengmo", name: "逢魔之时", desc: "17:00-23:00 打逢魔 Boss", reward: ["随机徽章", "御魂", "经验"], frequency: "daily" },
  { id: "yuhun", name: "御魂副本", desc: "日常刷御魂 / 魂土", reward: ["御魂", "青吉鬼"], frequency: "daily" },
  { id: "awake", name: "觉醒副本", desc: "刷觉醒材料", reward: ["觉醒材料", "体力"], frequency: "daily" },
  { id: "diyu", name: "地域鬼王", desc: "打地域鬼王拿勾玉御魂", reward: ["勾玉", "御魂", "金币"], frequency: "daily" },
  { id: "jiejie", name: "结界突破", desc: "结界突破刷御魂勾玉", reward: ["勾玉", "御魂", "结界卡"], frequency: "daily" },
  { id: "weipai", name: "式神委派", desc: "委派式神出任务收菜", reward: ["经验", "觉醒材料", "随机碎片"], frequency: "daily" },
  { id: "friend", name: "好友赠礼 / 协战", desc: "协战刷羁绊，互赠樱花", reward: ["羁绊", "樱花", "随机奖励"], frequency: "daily", optional: true },
  { id: "douji", name: "斗技上分", desc: "斗技，周三/周末额外奖励", reward: ["荣誉", "斗技勋章"], frequency: "daily", optional: true },
  // ── 周常 ──
  { id: "mimi", name: "秘闻副本", desc: "限时挑战拿皮肤", reward: ["式神皮肤", "勾玉", "御魂"], frequency: "weekly" },
  { id: "qilin", name: "麒麟 / 狩猎战", desc: "每周限次狩猎", reward: ["御魂", "麒麟buff", "随机碎片"], frequency: "weekly" },
  { id: "douji_weekly", name: "斗技周结算", desc: "周末结算领段位奖励", reward: ["勾玉", "段位奖励", "头像框"], frequency: "weekly" },
  { id: "shop", name: "商店刷新兑换", desc: "商店/勋章/荣誉兑换周刷新", reward: ["各种兑换物", "SSR碎片"], frequency: "weekly" },
  { id: "contest", name: "式神应援 / 当期活动", desc: "周活动与应援任务", reward: ["活动道具", "皮肤", "勾玉"], frequency: "weekly" },
]
