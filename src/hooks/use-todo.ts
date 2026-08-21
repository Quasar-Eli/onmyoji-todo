import { useCallback, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "onmyoji-todo-react-v2"
const DAY_KEY = "onmyoji-todo-react-day"

type StatusMap = Record<string, "done" | "skip" | undefined>

interface Persisted {
  daily: StatusMap
  weekly: StatusMap
}

const EMPTY: Persisted = { daily: {}, weekly: {} }

function dateKey(d = new Date()) {
  const pad = (n: number) => (n < 10 ? "0" + n : "" + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function load(): Persisted {
  if (localStorage.getItem(DAY_KEY) !== dateKey()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(EMPTY))
    localStorage.setItem(DAY_KEY, dateKey())
    return EMPTY
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Persisted) : EMPTY
    return {
      daily: parsed.daily ?? {},
      weekly: parsed.weekly ?? {},
    }
  } catch {
    return EMPTY
  }
}

export function useTodo() {
  const [state, setState] = useState<Persisted>(load)

  useEffect(() => {
    // 跨天自动重置（页面保持打开时）
    const check = () => {
      if (localStorage.getItem(DAY_KEY) !== dateKey()) {
        setState(load())
      }
    }
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  /** 点击任务卡片：done 与 none 之间切换（跳过态不参与点击切换） */
  const toggle = useCallback((frequency: "daily" | "weekly", id: string) => {
    setState((prev) => {
      const map = { ...(prev[frequency] ?? {}) }
      map[id] = map[id] === "done" ? undefined : "done"
      return { ...prev, [frequency]: map }
    })
  }, [])

  /** 单独切换跳过/不参与状态 */
  const toggleSkip = useCallback((frequency: "daily" | "weekly", id: string) => {
    setState((prev) => {
      const map = { ...(prev[frequency] ?? {}) }
      if (map[id] === "skip") {
        delete map[id]
      } else {
        map[id] = "skip"
      }
      return { ...prev, [frequency]: map }
    })
  }, [])

  const reset = useCallback(() => {
    setState(EMPTY)
  }, [])

  const stats = useMemo(() => {
    const all = [...Object.values(state.daily), ...Object.values(state.weekly)]
    const done = all.filter((v) => v === "done").length
    const skipped = all.filter((v) => v === "skip").length
    return { done, skipped }
  }, [state])

  return { state, toggle, toggleSkip, reset, stats }
}
