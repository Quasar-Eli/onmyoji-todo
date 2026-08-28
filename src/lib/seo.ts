/**
 * SEO 基础工具（G1）：动态标题 + meta description
 * HashRouter 的 SPA 无法被常规爬虫索引，此工具至少保证浏览器标签/分享卡片标题正确。
 */

import { useEffect } from "react"

const SITE_NAME = "游戏Wiki"

/** 更新浏览器标题与 meta description（纯副作用） */
export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!meta) {
        meta = document.createElement("meta")
        meta.name = "description"
        document.head.appendChild(meta)
      }
      meta.content = description
    }
  }, [title, description])
}
