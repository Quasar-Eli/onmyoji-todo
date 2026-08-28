import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase, type Game } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { MarkdownEditor } from "@/components/MarkdownEditor"
import { useAuth } from "@/context/AuthContext"
import { useDocumentTitle } from "@/lib/seo"
import { ArrowLeft, MessageSquare, Plus } from "lucide-react"

interface Topic {
  id: string
  title: string
  content: string
  user_id: string
  username?: string
  created_at: string
  updated_at: string
  reply_count?: number
}

export function TopicsPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [posting, setPosting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useDocumentTitle(game ? `${game.name} · 问答` : "问答")

  const load = async () => {
    if (!slug) return
    const { data: g } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle()
    if (!g) {
      setLoading(false)
      return
    }
    setGame(g as Game)
    const { data: t } = await supabase
      .from("topics")
      .select("*")
      .eq("game_id", (g as Game).id)
      .order("updated_at", { ascending: false })
    const rows = (t as Topic[] | null) ?? []
    // 作者昵称 + 回复数
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    let userMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds)
      if (profiles) userMap = Object.fromEntries(profiles.map((p) => [p.id, p.username]))
    }
    const { data: replies } = await supabase
      .from("topic_replies")
      .select("topic_id")
      .in("topic_id", rows.map((r) => r.id))
    const countMap: Record<string, number> = {}
    for (const r of (replies ?? []) as { topic_id: string }[]) {
      countMap[r.topic_id] = (countMap[r.topic_id] ?? 0) + 1
    }
    setTopics(
      rows.map((r) => ({
        ...r,
        username: userMap[r.user_id],
        reply_count: countMap[r.id] ?? 0,
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const post = async () => {
    if (!user || !game || !title.trim() || !content.trim()) return
    setPosting(true)
    const { error } = await supabase.from("topics").insert({
      game_id: game.id,
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    })
    setPosting(false)
    if (error) {
      setMsg("发布失败：" + error.message)
      return
    }
    setTitle("")
    setContent("")
    setMsg("已发布")
    void load()
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Skeleton className="mb-6 h-10 w-1/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
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

  const canModerate =
    profile?.role === "super_admin" || profile?.role === "global_editor"
  void canModerate

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        to={`/game/${game.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回 {game.name}
      </Link>

      <h1 className="mb-6 text-3xl font-bold">{game.name} · 问答</h1>

      {/* 发帖 */}
      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4">
          {user ? (
            <>
              <Label className="flex items-center gap-1">
                <Plus className="h-4 w-4 text-primary" />
                发起提问
              </Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="问题标题" />
              <MarkdownEditor value={content} onChange={setContent} rows={4} placeholder="补充问题描述..." />
              <Button onClick={() => void post()} disabled={posting || !title.trim() || !content.trim()}>
                {posting ? "发布中..." : "发布"}
              </Button>
              {msg && <p className="text-sm text-primary">{msg}</p>}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">登录后即可提问。</p>
          )}
        </CardContent>
      </Card>

      {topics.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">还没有提问，来抢第一帖。</p>
      ) : (
        <div className="flex flex-col gap-2">
          {topics.map((t) => (
            <Link key={t.id} to={`/game/${game.slug}/topics/${t.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-semibold">{t.title}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {t.reply_count}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.username ?? "用户"}</span>
                    <span>{new Date(t.updated_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
