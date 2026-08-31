import { useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { uploadImage } from "@/lib/supabase"

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
  const [uploading, setUploading] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  /** 上传图片并插入 Markdown 语法 */
  const insertImage = async (file: File) => {
    const ta = taRef.current
    if (!ta || uploading) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      const syntax = `\n![](${url})\n`
      const { selectionStart: start, selectionEnd: end } = ta
      const next = value.slice(0, start) + syntax + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(start + syntax.length, start + syntax.length)
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : "图片上传失败")
    } finally {
      setUploading(false)
    }
  }

  /** 粘贴图片时自动上传 */
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items ?? [])
    const file = items.find((it) => it.type.startsWith("image/"))?.getAsFile()
    if (!file) return
    e.preventDefault()
    void insertImage(file)
  }

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
        <button
          type="button"
          title={uploading ? "上传中…" : "插入图片（支持粘贴）"}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded px-1.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          {uploading ? "上传中…" : "🖼"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void insertImage(f)
            e.target.value = ""
          }}
        />
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
          onPaste={handlePaste}
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
