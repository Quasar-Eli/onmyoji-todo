import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useIsSuperAdmin } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Plus, ShieldAlert, Trash2 } from "lucide-react"
import { useDocumentTitle } from "@/lib/seo"

interface SensitiveWord {
  id: string
  word: string
  level: number
  created_at: string
}

const levelLabel = (level: number) => (level === 1 ? "硬拒绝" : "软提示")

/** 敏感词管理（I4）：仅超管可维护 sensitive_words 表 */
export function AdminSensitiveWordsPage() {
  const isSuper = useIsSuperAdmin()

  useDocumentTitle("敏感词管理")
  const [words, setWords] = useState<SensitiveWord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [word, setWord] = useState("")
  const [level, setLevel] = useState("1")
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await supabase
      .from("sensitive_words")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      setLoadError("无法加载敏感词表：" + error.message + "（请先在 Supabase 执行迁移 SQL）")
      setWords([])
    } else {
      setWords((data as SensitiveWord[]) ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isSuper) void load()
  }, [isSuper])

  const addWord = async () => {
    const w = word.trim()
    if (!w) return
    const { error } = await supabase
      .from("sensitive_words")
      .insert({ word: w, level: Number(level) })
    if (!error) {
      setWord("")
      setMsg(`已添加：${w}`)
      void load()
    } else {
      setMsg("添加失败：" + error.message)
    }
  }

  const removeWord = async (id: string) => {
    await supabase.from("sensitive_words").delete().eq("id", id)
    void load()
  }

  if (!isSuper) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        仅超管可管理敏感词。
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <ShieldAlert className="h-6 w-6 text-destructive" />
        敏感词管理
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>新增敏感词</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>敏感词</Label>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="输入要拦截的词"
              onKeyDown={(e) => e.key === "Enter" && addWord()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>级别</Label>
            <Select value={level} onValueChange={(v) => setLevel(v ?? "1")}>
              <SelectTrigger>
                <SelectValue getLabel={(v) => levelLabel(Number(v))} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">硬拒绝</SelectItem>
                <SelectItem value="2">软提示</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void addWord()} disabled={!word.trim()}>
            <Plus className="h-4 w-4" />
            添加
          </Button>
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          硬拒绝（level=1）：昵称/评论提交时直接拦截；软提示（level=2）：仅提示不拦截。
        </p>
      </Card>

      {msg && <p className="mb-4 text-sm text-primary">{msg}</p>}
      {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}

      {loading ? (
        <p className="py-10 text-center text-muted-foreground">加载中...</p>
      ) : words.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">暂无敏感词，可先添加。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {words.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{w.word}</span>
                <span
                  className={
                    w.level === 1
                      ? "rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                      : "rounded-full bg-secondary px-2 py-0.5 text-xs"
                  }
                >
                  {levelLabel(w.level)}
                </span>
              </div>
              <ConfirmDialog
                title={`删除敏感词"${w.word}"？`}
                description="删除后该词不再被拦截。"
                onConfirm={() => removeWord(w.id)}
              >
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ConfirmDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
