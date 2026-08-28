import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Category, type Game, type Module } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { MarkdownEditor } from "@/components/MarkdownEditor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/context/AuthContext"
import { useDocumentTitle } from "@/lib/seo"
import { ArrowLeft, Send } from "lucide-react"

/** H4：用户投稿（进入 pending，待管理员审核发布） */
export function SubmitArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [moduleId, setModuleId] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useDocumentTitle(game ? `向「${game.name}」投稿` : "投稿")

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      const { data: g } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle()
      if (!g) {
        setLoading(false)
        return
      }
      const gameData = g as Game
      setGame(gameData)
      const [cRes, mRes] = await Promise.all([
        supabase.from("categories").select("*").eq("game_id", gameData.id).order("sort_order"),
        supabase.from("modules").select("*").eq("game_id", gameData.id).order("sort_order"),
      ])
      setCategories((cRes.data as Category[]) ?? [])
      setModules((mRes.data as Module[]) ?? [])
      setLoading(false)
    })()
  }, [slug])

  const submit = async () => {
    if (!user || !game || !moduleId || !title.trim()) return
    setSubmitting(true)
    const module = modules.find((m) => m.id === moduleId)
    const { error } = await supabase.from("articles").insert({
      game_id: game.id,
      category_id: module?.category_id ?? null,
      module_id: moduleId,
      title: title.trim(),
      content: content.trim(),
      created_by: user.id,
      status: "pending",
    })
    setSubmitting(false)
    if (error) {
      setMsg("提交失败：" + error.message)
      return
    }
    setDone(true)
    setMsg("投稿成功！等待管理员审核后发布。")
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Skeleton className="mb-6 h-10 w-1/3" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        未找到该栏目
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        to={`/game/${game.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回 {game.name}
      </Link>

      <h1 className="mb-6 text-3xl font-bold">向「{game.name}」投稿</h1>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          {!user ? (
            <p className="py-8 text-center text-muted-foreground">登录后即可投稿。</p>
          ) : done ? (
            <div className="py-8 text-center">
              <p className="text-lg font-semibold text-primary">投稿成功！</p>
              <p className="mt-1 text-sm text-muted-foreground">
                内容已进入待审核状态，管理员通过后将在栏目中展示。
              </p>
              <Button asChild className="mt-4">
                <Link to={`/game/${game.slug}`}>返回栏目</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>所属模块 *</Label>
                <Select value={moduleId} onValueChange={(v) => setModuleId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue getLabel={(v) => {
                      const m = modules.find((x) => x.id === v)
                      const c = categories.find((x) => x.id === m?.category_id)
                      return m ? `${c?.name ?? ""} / ${m.name}` : "选择模块"
                    }} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) =>
                      modules
                        .filter((m) => m.category_id === c.id)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {c.name} / {m.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>标题 *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="内容标题" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>内容（Markdown）</Label>
                <MarkdownEditor value={content} onChange={setContent} rows={12} />
              </div>
              <Button onClick={() => void submit()} disabled={submitting || !title.trim() || !moduleId}>
                <Send className="h-4 w-4" />
                {submitting ? "提交中..." : "提交投稿（待审核）"}
              </Button>
              {msg && <p className="text-sm text-primary">{msg}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
