/**
 * 敏感词过滤工具（I4）
 *
 * - 前端 DFA 即时提示：基于内置词库做同步过滤，不依赖网络
 * - 远程强校验：调用服务端 RPC check_sensitive（词库存 sensitive_words 表，后台可维护）
 * - 说明：前端词库仅用于体验层，最终防线在服务端（RPC / 触发器 / RLS）
 */

import { supabase } from "@/lib/supabase"

/** 内置基础词库（示例，可按需通过后台"敏感词管理"扩充服务端词库） */
const BASE_SENSITIVE_WORDS: readonly string[] = [
  // 中文辱骂/贬损类
  "傻逼", "傻比", "煞笔", "贱人", "妈的", "他妈", "你妈", "草泥马",
  "去死", "滚蛋", "混蛋", "王八蛋", "狗日", "狗逼", "畜生", "杂种",
  "白痴", "蠢货", "废物", "脑残", "弱智", "低能", "垃圾", "死全家",
  "吃屎", "婊子", "鸡巴", "屌丝", "龟孙", "贱货", "人渣",
  // 英文脏话
  "fuck", "shit", "bitch", "asshole", "dick", "cunt", "bastard", "whore",
]

/** 前缀树节点 */
interface TrieNode {
  children: Map<string, TrieNode>
  end: boolean
}

/** 构建前缀树（不可变式归约） */
const buildTrie = (words: readonly string[]): TrieNode =>
  words.reduce<TrieNode>(
    (root, word) => {
      let node = root
      for (const ch of word) {
        if (!node.children.has(ch)) {
          node.children.set(ch, { children: new Map(), end: false })
        }
        node = node.children.get(ch)!
      }
      node.end = true
      return root
    },
    { children: new Map(), end: false }
  )

const trie = buildTrie(BASE_SENSITIVE_WORDS)

/**
 * 同步检查文本命中的内置敏感词（大小写不敏感）
 * @returns 命中的敏感词数组
 */
export const checkSensitive = (text: string): readonly string[] => {
  const lower = text.toLowerCase()
  const hits: string[] = []
  for (let i = 0; i < lower.length; i++) {
    let node = trie
    for (let j = i; j < lower.length; j++) {
      const ch = lower[j]
      if (!node.children.has(ch)) break
      node = node.children.get(ch)!
      if (node.end) {
        const word = lower.slice(i, j + 1)
        if (!hits.includes(word)) hits.push(word)
      }
    }
  }
  return hits
}

/**
 * 远程强校验（服务端 sensitive_words 表，level=1 硬拒绝词）
 * 函数不存在时降级返回空数组，不阻塞主流程
 */
export const checkSensitiveRemote = async (text: string): Promise<readonly string[]> => {
  try {
    const { data, error } = await supabase.rpc("check_sensitive", { input_text: text })
    if (error) return []
    return (data as string[] | null) ?? []
  } catch {
    return []
  }
}

/** 昵称校验：非空 / 长度 2~20 / 敏感词 */
export const validateUsername = (name: string): string | null => {
  const value = name.trim()
  if (value.length === 0) return "昵称不能为空"
  if (value.length < 2) return "昵称至少 2 个字符"
  if (value.length > 20) return "昵称最多 20 个字符"
  const hits = checkSensitive(value)
  if (hits.length > 0) return `昵称包含敏感词：${hits.join("、")}`
  return null
}

/** 评论内容校验：非空 / 敏感词 */
export const validateComment = (content: string): string | null => {
  const value = content.trim()
  if (value.length === 0) return "评论内容不能为空"
  if (value.length > 500) return "评论最多 500 个字符"
  const hits = checkSensitive(value)
  if (hits.length > 0) return `评论包含敏感词：${hits.join("、")}`
  return null
}
