import { useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

interface Action {
  label: string
  title: string
  run: () => void
}

/** F4：简易 Markdown 编辑器（工具栏 + 分栏预览） */
export function MarkdownEditor({ value, onChange, rows = 12, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write")
  const taRef = useRef<HTMLTextAreaElement>(null)

  /** 在光标处插入语法，并选中占位文本 */
  const insert = (before: string, after = "", placeholderText = "文本") => {
    const ta = taRef.current
    if (!ta) return
    const { selectionStart: start, selectionEnd: end } = ta
    const selected = value.slice(start, end) || placeholderText
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const actions: Action[] = [
    { label: "B", title: "加粗", run: () => insert("**", "**", "文字") },
    { label: "I", title: "斜体", run: () => insert("*", "*", "文字") },
    { label: "H2", title: "二级标题", run: () => insert("\n## ", "\n", "标题") },
    { label: "🔗", title: "链接", run: () => insert("[", "](https://)", "链接文字") },
    { label: "•", title: "无序列表", run: () => insert("\n- ") },
    { label: ">", title: "引用", run: () => insert("\n> ") },
    { label: "</>", title: "代码块", run: () => insert("\n```\n", "\n```\n", "code") },
    { label: "表", title: "表格", run: () => insert("\n| 列1 | 列2 |\n| --- | --- |\n| 值 | 值 |\n") },
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-input">
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            title={a.title}
            onClick={a.run}
            className="rounded px-1.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {a.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            size="sm"
            className="h-6 px-2 text-xs"
            variant={mode === "write" ? "default" : "outline"}
            onClick={() => setMode("write")}
          >
            编辑
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-6 px-2 text-xs"
            variant={mode === "preview" ? "default" : "outline"}
            onClick={() => setMode("preview")}
          >
            预览
          </Button>
        </div>
      </div>
      {mode === "write" ? (
        <Textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="border-0 shadow-none focus-visible:ring-0"
        />
      ) : (
        <div className={cn("prose prose-slate max-w-none p-3 dark:prose-invert")}>
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-sm text-muted-foreground">暂无内容</p>
          )}
        </div>
      )}
    </div>
  )
}
