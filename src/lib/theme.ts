/**
 * 主题（F1 暗黑模式）：class 策略 + localStorage 持久化 + 跟随系统
 */

import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "wiki-theme"

export type Theme = "light" | "dark"

/** 读取初始主题：localStorage 优先，其次系统偏好 */
const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/** 应用主题 class 到根元素 */
const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }, [])

  const setLight = useCallback(() => setTheme("light"), [])
  const setDark = useCallback(() => setTheme("dark"), [])

  return { theme, toggle, setLight, setDark }
}
