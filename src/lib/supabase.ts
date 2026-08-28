import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error("缺少 Supabase 环境变量：请检查 .env 中的 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY")
}

export const supabase = createClient(url, anonKey)

export type Role = "user" | "game_admin" | "global_editor" | "super_admin"

export interface Profile {
  id: string
  username: string
  role: Role
  avatar_url: string | null
  created_at: string
}

export interface Game {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  accent_color: string | null
  editor_id: string | null
  features?: string[] | null
  created_at: string
}

export interface Category {
  id: string
  game_id: string
  name: string
  sort_order: number
}

export interface Module {
  id: string
  game_id: string
  category_id: string
  name: string
  sort_order: number
}

export interface Article {
  id: string
  game_id: string
  category_id: string | null
  module_id: string | null
  title: string
  content: string
  created_by: string | null
  created_at: string
  updated_at: string
  view_count?: number
  like_count?: number
  tags?: string[]
  version?: string | null
  status?: "draft" | "pending" | "published"
}

export interface Comment {
  id: string
  article_id: string | null
  target_type?: string
  target_id?: string | null
  parent_id: string | null
  user_id: string
  content: string
  created_at: string
  like_count?: number
}

export type Rarity = "SP" | "SSR" | "SR" | "R"

export interface Item {
  id: string
  game_id: string
  name: string
  type: string | null
  rarity: string | null
  image_url: string | null
  description: string | null
  detail: string | null
  source: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Shikigami {
  id: string
  game_id: string
  name: string
  rarity: Rarity
  type: string | null
  image_url: string | null
  description: string | null
  cultivate: string | null
  yuhun: string | null
  panel: string | null
  pve: string | null
  pvp: string | null
  attribute?: string | null
  cv?: string | null
  biography?: string | null
  version?: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}