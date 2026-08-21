import { useCallback, useEffect, useMemo, useState } from "react"

const STORAGE_KEY = "onmyoji-todo-react-v1"
const DAY_KEY = "onmyoji-todo-react-day"

type DoneMap = Record<string, boolean>

interface Persisted {
  daily: DoneMap
  weekly: DoneMap
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

  const toggle = useCallback((frequency: "daily" | "weekly", id: string) => {
    setState((prev) => {
      const map = { ...(prev[frequency] ?? {}) }
      map[id] = !map[id]
      return { ...prev, [frequency]: map }
    })
  }, [])

  const reset = useCallback(() => {
    setState(EMPTY)
  }, [])

  const doneCount = useMemo(() => {
    let n = 0
    for (const k of Object.keys(state.daily)) if (state.daily[k]) n++
    for (const k of Object.keys(state.weekly)) if (state.weekly[k]) n++
    return n
  }, [state])

  return { state, toggle, reset, doneCount }
}
