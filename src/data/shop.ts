/** 商店每周必换攻略（基于主流攻略整理的常驻内容） */

export type ShopPriority = "high" | "medium" | "low"

/** 兑换后实际产出的资源 */
export interface YieldItem {
  name: string
  amount: number
  unit?: string
}

export interface ShopItem {
  id: string
  /** 商店名称 */
  shop: string
  /** 兑换物 */
  name: string
  /** 每周可换数量/上限 */
  limit: string
  /** 消耗材料 */
  cost: string
  priority: ShopPriority
  note: string
  /** 实际产出（用于汇总统计），无则不计入 */
  yield?: YieldItem[]
}

export const SHOP_PRIORITY_LABEL: Record<ShopPriority, string> = {
  high: "必换",
  medium: "有余力换",
  low: "看需求换",
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "rongyu_heidan",
    shop: "荣誉商店",
    name: "黑蛋碎片",
    limit: "每周 2",
    cost: "荣誉点 540/片",
    priority: "high",
    note: "攒黑蛋核心来源，必换",
    yield: [{ name: "黑蛋碎片", amount: 2 }],
  },
  {
    id: "rongyu_lanpiao",
    shop: "荣誉商店",
    name: "蓝票",
    limit: "每周 1",
    cost: "荣誉点",
    priority: "high",
    note: "蓝票必换",
    yield: [{ name: "蓝票", amount: 1 }],
  },
  {
    id: "xunzhang_heidan",
    shop: "勋章商店",
    name: "黑蛋",
    limit: "每周 1",
    cost: "勋章 480",
    priority: "high",
    note: "整只黑蛋，性价比极高",
    yield: [{ name: "黑蛋", amount: 1 }],
  },
  {
    id: "xunzhang_lanpiao",
    shop: "勋章商店",
    name: "蓝票",
    limit: "每周 1",
    cost: "勋章 180",
    priority: "high",
    note: "蓝票必换",
    yield: [{ name: "蓝票", amount: 1 }],
  },
  {
    id: "xunzhang_tili",
    shop: "勋章商店",
    name: "体力",
    limit: "每周 1 次",
    cost: "勋章",
    priority: "high",
    note: "大量体力，必换",
    yield: [{ name: "体力", amount: 300 }],
  },
  {
    id: "gongxun_lanpiao",
    shop: "阴阳寮功勋商店",
    name: "蓝票",
    limit: "每周 2",
    cost: "功勋 240",
    priority: "high",
    note: "功勋商店性价比最高的一档",
    yield: [{ name: "蓝票", amount: 2 }],
  },
  {
    id: "gongxun_heidan",
    shop: "阴阳寮功勋商店",
    name: "黑蛋碎片礼包",
    limit: "每周 1",
    cost: "功勋 200",
    priority: "high",
    note: "黑蛋碎片必买（3-5片）",
    yield: [{ name: "黑蛋碎片", amount: 4 }],
  },
  {
    id: "gongxun_pifujuan",
    shop: "阴阳寮功勋商店",
    name: "皮肤券",
    limit: "每周 1",
    cost: "功勋 50",
    priority: "high",
    note: "皮肤券必买",
    yield: [{ name: "皮肤券", amount: 5 }],
  },
  {
    id: "miqijuan_yuhun",
    shop: "秘卷屋",
    name: "御魂兑换",
    limit: "每周 30+40",
    cost: "蛇皮 / 封魔魂",
    priority: "medium",
    note: "指定御魂定向换，缺哪个换哪个",
  },
  {
    id: "shenkan_heida",
    shop: "神龛",
    name: "御行达摩（黑蛋）",
    limit: "看库存",
    cost: "御札 1500",
    priority: "high",
    note: "神龛里性价比最高的兑换物（两周一次）",
    yield: [{ name: "黑蛋", amount: 0.5 }],
  },
  {
    id: "jinyin_yaoling",
    shop: "杂货 / 金币",
    name: "御灵钥匙",
    limit: "每周 40",
    cost: "金币 20w",
    priority: "medium",
    note: "囤着肝绘卷/活动用",
    yield: [{ name: "御灵钥匙", amount: 40 }],
  },
  {
    id: "zidu",
    shop: "姿度商店",
    name: "姿度",
    limit: "每周",
    cost: "特定材料",
    priority: "low",
    note: "看个人收集需求",
  },
]

/** 汇总"必换"（high）项的实际产出，按资源累加 */
export function sumHighPriorityYields(): YieldItem[] {
  const map = new Map<string, number>()
  for (const item of SHOP_ITEMS) {
    if (item.priority !== "high" || !item.yield) continue
    for (const y of item.yield) {
      map.set(y.name, (map.get(y.name) ?? 0) + y.amount)
    }
  }
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
}