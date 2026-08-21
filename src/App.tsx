import { useMemo, useState } from "react"
import { TASKS } from "@/data/tasks"
import { useTodo } from "@/hooks/use-todo"
import { TaskCard } from "@/components/TaskCard"
import { ShopPanel } from "@/components/ShopPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Gem, RotateCcw, Store, CalendarDays, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "daily" | "weekly" | "shop"

function todayCN() {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const TABS: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
  { key: "daily", label: "每日必做", icon: CalendarDays },
  { key: "weekly", label: "每周必做", icon: CalendarClock },
  { key: "shop", label: "商店必换", icon: Store },
]

export default function App() {
  const { state, toggle, toggleSkip, reset, stats } = useTodo()
  const [tab, setTab] = useState<Tab>("daily")
  const [showSkipped, setShowSkipped] = useState(true)

  const daily = useMemo(() => TASKS.filter((t) => t.frequency === "daily"), [])
  const weekly = useMemo(() => TASKS.filter((t) => t.frequency === "weekly"), [])

  const participating = TASKS.length - stats.skipped
  const pct = participating ? Math.round((stats.done / participating) * 100) : 0

  const renderTask = (task: (typeof TASKS)[number], frequency: "daily" | "weekly") => {
    const status = state[frequency][task.id]
    if (!showSkipped && status === "skip") return null
    return (
      <TaskCard
        key={task.id}
        task={task}
        status={status}
        onToggle={(id) => toggle(frequency, id)}
        onToggleSkip={(id) => toggleSkip(frequency, id)}
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
      <header className="mb-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-3xl">
          <Gem className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-wide">阴阳师 · 攻略代办</h1>
        </div>
        <p className="text-sm text-muted-foreground">{todayCN()}</p>
      </header>

      {/* Tab 导航 */}
      <nav className="mb-5 grid grid-cols-3 gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <Button
              key={t.key}
              variant={active ? "default" : "ghost"}
              className={cn(
                "flex h-11 flex-col items-center gap-0.5",
                !active && "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setTab(t.key)}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{t.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* 每日/每周顶部的进度条（商店页不显示） */}
      {tab !== "shop" && (
        <Card className="mb-6 p-4">
          <CardContent className="flex flex-col gap-2 p-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">已完成 / 参与</span>
              <span className="font-semibold">
                {stats.done} / {participating}
              </span>
            </div>
            <Progress value={pct} />
            <p className="text-right text-xs text-muted-foreground">
              {pct}% {stats.skipped > 0 && `· ${stats.skipped} 项设为不参与`}
            </p>
          </CardContent>
        </Card>
      )}

      <main className="flex flex-col gap-8">
        {tab === "daily" && (
          <section>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="border-l-4 border-primary pl-3">每日必做</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-3">
              {daily.map((task) => renderTask(task, "daily"))}
            </div>
          </section>
        )}

        {tab === "weekly" && (
          <section>
            <CardHeader className="flex items-center justify-between px-0 pt-0">
              <CardTitle className="border-l-4 border-primary pl-3">每周必做</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowSkipped((v) => !v)}
              >
                {showSkipped ? "隐藏不参与" : "显示不参与"}
              </Button>
            </CardHeader>
            <div className="flex flex-col gap-3">
              {weekly.map((task) => renderTask(task, "weekly"))}
            </div>
          </section>
        )}

        {tab === "shop" && (
          <section>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="border-l-4 border-primary pl-3">商店每周必换</CardTitle>
            </CardHeader>
            <ShopPanel />
          </section>
        )}
      </main>

      <footer className="mt-10 flex flex-col items-center gap-3 border-t pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          数据仅保存在本浏览器。每日 0 点自动重置。任务标注性价比，可设为“不参与”从而不计入进度。
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("确定重置今日所有勾选？")) reset()
          }}
        >
          <RotateCcw className="h-4 w-4" />
          重置今日
        </Button>
      </footer>
    </div>
  )
}
