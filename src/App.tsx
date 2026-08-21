import { TASKS } from "@/data/tasks"
import { useTodo } from "@/hooks/use-todo"
import { TaskCard } from "@/components/TaskCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { RotateCcw, Gem } from "lucide-react"

function todayCN() {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export default function App() {
  const { state, toggle, reset, doneCount } = useTodo()
  const total = TASKS.length
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  const daily = TASKS.filter((t) => t.frequency === "daily")
  const weekly = TASKS.filter((t) => t.frequency === "weekly")

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
      <header className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-3xl">
          <Gem className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-wide">阴阳师 · 每日代办</h1>
        </div>
        <p className="text-sm text-muted-foreground">{todayCN()}</p>
        <Card className="w-full max-w-md p-4">
          <CardContent className="flex flex-col gap-2 p-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">今日完成</span>
              <span className="font-semibold">
                {doneCount} / {total}
              </span>
            </div>
            <Progress value={pct} />
            <p className="text-right text-xs text-muted-foreground">{pct}%</p>
          </CardContent>
        </Card>
      </header>

      <main className="flex flex-col gap-8">
        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="border-l-4 border-primary pl-3">每日任务</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {daily.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                done={!!state.daily[task.id]}
                onToggle={(id) => toggle("daily", id)}
              />
            ))}
          </div>
        </section>

        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle className="border-l-4 border-primary pl-3">周常任务</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {weekly.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                done={!!state.weekly[task.id]}
                onToggle={(id) => toggle("weekly", id)}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-10 flex flex-col items-center gap-3 border-t pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          数据仅保存在本浏览器。每日 0 点自动重置，清除浏览器数据会丢失。
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
