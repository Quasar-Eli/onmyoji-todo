/**
 * 游戏功能配置（B 多游戏平台）
 *
 * 每个游戏通过 games.features 声明启用哪些专属功能；
 * 为空数组表示启用全部（向后兼容，老数据无需改动即全量显示）。
 * 入口渲染与后台配置共用此定义，避免两处维护。
 */

export interface FeatureMeta {
  icon: string
  title: string
  to: (slug: string) => string
}

export const FEATURES: Record<string, FeatureMeta> = {
  shikigami: { icon: "⚔️", title: "式神图鉴", to: (slug) => `/game/${slug}/shikigami` },
  items: { icon: "🛡️", title: "装备图鉴", to: (slug) => `/game/${slug}/items` },
  gacha: { icon: "🎴", title: "抽卡模拟", to: (slug) => `/game/${slug}/gacha` },
  topics: { icon: "💬", title: "问答", to: (slug) => `/game/${slug}/topics` },
  submit: { icon: "📝", title: "投稿", to: (slug) => `/game/${slug}/submit` },
  tools: { icon: "🧮", title: "工具", to: (slug) => `/game/${slug}/tools` },
}

/** 所有功能键（用于后台多选、前端默认全量） */
export const FEATURE_KEYS: readonly string[] = Object.keys(FEATURES)

export const featureLabel = (key: string): string => FEATURES[key]?.title ?? key

/**
 * 计算某游戏实际启用的功能键集合
 * @param features 游戏配置（可能为 null/undefined/空数组）
 */
export const enabledFeatures = (features?: string[] | null): string[] => {
  if (!features || features.length === 0) return [...FEATURE_KEYS]
  return FEATURE_KEYS.filter((k) => features.includes(k))
}
