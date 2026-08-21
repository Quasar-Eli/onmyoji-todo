import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { COST_LABEL, type Task } from "@/data/tasks"
import { cn } from "@/lib/utils"
import { Ban, RotateCcw } from "lucide-react"

type Status = "done" | "skip" | undefined

interface TaskCardProps {
  task: Task
  status: Status
  onToggle: (id: string) => void
  onToggleSkip: (id: string) => void
}

const costBadgeVariant: Record<Task["cost"], "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
}

export function TaskCard({ task, status, onToggle, onToggleSkip }: TaskCardProps) {
  const done = status === "done"
  const skipped = status === "skip"

  return (
    <Card
      className={cn(
        "flex items-start gap-3 p-4 transition-colors",
        done && "opacity-60",
        skipped && "opacity-40"
      )}
    >
      <Checkbox
        checked={done}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
        aria-label={task.name}
        disabled={skipped}
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-medium",
              done && "line-through",
              skipped && "line-through text-muted-foreground"
            )}
          >
            {task.name}
          </span>
          <Badge variant={costBadgeVariant[task.cost]}>{COST_LABEL[task.cost]}</Badge>
          {done && <Badge variant="success">完成</Badge>}
          {skipped && <Badge variant="secondary">不参与</Badge>}
        </div>
        {task.desc && <p className="text-sm text-muted-foreground">{task.desc}</p>}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {task.reward.map((r) => (
            <Badge key={r} variant="outline" className="text-muted-foreground">
              {r}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              onToggleSkip(task.id)
            }}
            aria-label={skipped ? "重新参与" : "设为不参与"}
          >
            {skipped ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
            {skipped ? "恢复" : "不参与"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
