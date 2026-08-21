import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { Task } from "@/data/tasks"

interface TaskCardProps {
  task: Task
  done: boolean
  onToggle: (id: string) => void
}

export function TaskCard({ task, done, onToggle }: TaskCardProps) {
  return (
    <Card
      className={`flex items-start gap-3 p-4 transition-colors ${
        done ? "opacity-60" : ""
      }`}
      onClick={() => onToggle(task.id)}
    >
      <Checkbox
        checked={done}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5"
        aria-label={task.name}
      />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-medium ${done ? "line-through" : ""}`}>{task.name}</span>
          {task.optional && <Badge variant="secondary">可选</Badge>}
          {done && <Badge variant="success">完成</Badge>}
        </div>
        {task.desc && <p className="text-sm text-muted-foreground">{task.desc}</p>}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {task.reward.map((r) => (
            <Badge key={r} variant="outline" className="text-muted-foreground">
              {r}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}
