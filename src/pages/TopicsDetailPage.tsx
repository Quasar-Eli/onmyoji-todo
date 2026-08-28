import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { supabase, type Game } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useAuth } from "@/context/AuthContext"
import { useDocumentTitle } from "@/lib/seo"
import { ArrowLeft, Trash2 } from "lucide-react"

interface Topic {
  id: string
  title: string
  content: string
  user_id: string
  created_at: string
  username?: string
}
interface Reply {
  id: string
  user_id: string
  content: string
  created_at: string
  username?: string
}

export function TopicsDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const { user, profile } = useAuth()
  const [game, setGame] = useState<Game | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useDocumentTitle(topic?.title, topic ? `${topic.title} - ${game?.name ?? ""} 问答` : undefined)

  const load = async () => {
    if (!id || !slug) return
    const [{ data: g }, { data: t }] = await Promise.all([
      supabase.from("games").select("*").eq("slug", slug).maybeSingle(),
      supabase.from("topics").select("*").eq("id", id).maybeSingle(),
    ])
    const topicData = (t as Topic) ?? null
    setGame((g as Game) ?? null)
    setTopic(topicData)

    if (topicData) {
      const [{ data: authorData }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("username").eq("id", topicData.user_id).maybeSingle(),
        supabase.from("topic_replies").select("*").eq("topic_id", topicData.id).order("created_at", { ascending: true }),
      ])
      setTopic({ ...topicData, username: (authorData as { username: string } | null)?.username })

      const rows = (r as Reply[] | null) ?? []
      const userIds = [...new Set(rows.map((x) => x.user_id))]
      let userMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds)
        if (profiles) userMap = Object.fromEntries(profiles.map((p) => [p.id, p.username]))
      }
      setReplies(rows.map((x) => ({ ...x, username: userMap[x.user_id] })))
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, slug])

  const submitReply = async () => {
    if (!user || !topic || !replyContent.trim()) return
    setSending(true)
    const { error } = await supabase.from("topic_replies").insert({
      topic_id: topic.id,
      user_id: user.id,
      content: replyContent.trim(),
    })
    setSending(false)
    if (!error) {
      setReplyContent("")
      await load()
    }
  }

  const deleteTopic = async () => {
    if (!topic) return
    await supabase.from("topics").delete().eq("id", topic.id)
    if (game) window.location.hash = `#/game/${game.slug}/topics`
  }

  const deleteReply = async (replyId: string) => {
    await supabase.from("topic_replies").delete().eq("id", replyId)
    await load()
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!topic || !game) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-muted-foreground">
        帖子不存在或已被删除
      </div>
    )
  }

  const canModerate = profile?.role === "super_admin" || profile?.role === "global_editor"

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        to={`/game/${game.slug}/topics`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回问答
      </Link>

      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            {(profile?.id === topic.user_id || canModerate) && (
              <ConfirmDialog
                title="删除该帖子？"
                description="会连带删除所有回复，且不可恢复。"
                onConfirm={() => void deleteTopic()}
              >
                <Button size="sm" variant="ghost" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ConfirmDialog>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {topic.username ?? "用户"} · {new Date(topic.created_at).toLocaleString()}
          </div>
          <div className="prose prose-slate mt-3 max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">回复（{replies.length}）</h2>
      {user ? (
        <Card className="mb-4">
          <CardContent className="flex gap-2 p-3">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="写下你的回复..."
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
            />
            <Button onClick={() => void submitReply()} disabled={sending || !replyContent.trim()}>
              {sending ? "发送中..." : "回复"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">登录后即可回复。</p>
      )}

      {replies.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">还没有回复</p>
      ) : (
        <div className="flex flex-col gap-2">
          {replies.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{r.username?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{r.username ?? "用户"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{r.content}</p>
                    {(profile?.id === r.user_id || canModerate) && (
                      <ConfirmDialog
                        title="删除该回复？"
                        description="删除后不可恢复。"
                        onConfirm={() => deleteReply(r.id)}
                      >
                        <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-destructive">
                          <Trash2 className="h-3 w-3" />
                          删除
                        </Button>
                      </ConfirmDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
